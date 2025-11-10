import { Embedding, EmbeddingVector } from './base-embedding';

export interface OpenCodeEmbeddingConfig {
    model: string;
    apiKey: string;
    baseURL?: string; // OpenCode AI API endpoint
}

interface OpenCodeEmbeddingResponse {
    data: Array<{
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

export class OpenCodeEmbedding extends Embedding {
    private config: OpenCodeEmbeddingConfig;
    private dimension: number = 1536; // Default dimension
    protected maxTokens: number = 8192; // Maximum tokens for OpenCode AI embedding models

    constructor(config: OpenCodeEmbeddingConfig) {
        super();
        this.config = config;
    }

    private getBaseURL(): string {
        return this.config.baseURL || 'https://api.opencode.ai/v1';
    }

    private async makeRequest(endpoint: string, body: any): Promise<any> {
        const url = `${this.getBaseURL()}${endpoint}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenCode AI API error (${response.status}): ${errorText}`);
        }

        return await response.json();
    }

    async detectDimension(testText: string = "test"): Promise<number> {
        const model = this.config.model || 'opencode-embed-v1';
        const knownModels = OpenCodeEmbedding.getSupportedModels();

        // Use known dimension for standard models
        if (knownModels[model]) {
            return knownModels[model].dimension;
        }

        // For custom models, make API call to detect dimension
        try {
            const processedText = this.preprocessText(testText);
            const response: OpenCodeEmbeddingResponse = await this.makeRequest('/embeddings', {
                model: model,
                input: processedText,
            });

            if (!response.data || !response.data[0] || !response.data[0].embedding) {
                throw new Error('Invalid response from OpenCode AI API');
            }

            return response.data[0].embedding.length;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Re-throw authentication errors
            if (errorMessage.includes('API key') || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
                throw new Error(`Failed to detect dimension for model ${model}: ${errorMessage}`);
            }

            // For other errors, throw exception
            throw new Error(`Failed to detect dimension for model ${model}: ${errorMessage}`);
        }
    }

    async embed(text: string): Promise<EmbeddingVector> {
        const processedText = this.preprocessText(text);
        const model = this.config.model || 'opencode-embed-v1';

        const knownModels = OpenCodeEmbedding.getSupportedModels();
        if (knownModels[model] && this.dimension !== knownModels[model].dimension) {
            this.dimension = knownModels[model].dimension;
        } else if (!knownModels[model]) {
            this.dimension = await this.detectDimension();
        }

        try {
            const response: OpenCodeEmbeddingResponse = await this.makeRequest('/embeddings', {
                model: model,
                input: processedText,
            });

            if (!response.data || !response.data[0] || !response.data[0].embedding) {
                throw new Error('Invalid response from OpenCode AI API');
            }

            // Update dimension from actual response
            this.dimension = response.data[0].embedding.length;

            return {
                vector: response.data[0].embedding,
                dimension: this.dimension
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to generate OpenCode AI embedding: ${errorMessage}`);
        }
    }

    async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
        const processedTexts = this.preprocessTexts(texts);
        const model = this.config.model || 'opencode-embed-v1';

        const knownModels = OpenCodeEmbedding.getSupportedModels();
        if (knownModels[model] && this.dimension !== knownModels[model].dimension) {
            this.dimension = knownModels[model].dimension;
        } else if (!knownModels[model]) {
            this.dimension = await this.detectDimension();
        }

        try {
            const response: OpenCodeEmbeddingResponse = await this.makeRequest('/embeddings', {
                model: model,
                input: processedTexts,
            });

            if (!response.data || response.data.length === 0) {
                throw new Error('Invalid response from OpenCode AI API');
            }

            this.dimension = response.data[0].embedding.length;

            return response.data.map((item) => ({
                vector: item.embedding,
                dimension: this.dimension
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to generate OpenCode AI batch embeddings: ${errorMessage}`);
        }
    }

    getDimension(): number {
        // For custom models, we need to detect the dimension first
        const model = this.config.model || 'opencode-embed-v1';
        const knownModels = OpenCodeEmbedding.getSupportedModels();

        // If it's a known model, return its known dimension
        if (knownModels[model]) {
            return knownModels[model].dimension;
        }

        // For custom models, return the current dimension
        // Note: This may be incorrect until detectDimension() is called
        console.warn(`[OpenCodeEmbedding] ⚠️ getDimension() called for custom model '${model}' - returning ${this.dimension}. Call detectDimension() first for accurate dimension.`);
        return this.dimension;
    }

    getProvider(): string {
        return 'OpenCode';
    }

    /**
     * Set model type
     * @param model Model name
     */
    async setModel(model: string): Promise<void> {
        this.config.model = model;
        const knownModels = OpenCodeEmbedding.getSupportedModels();
        if (knownModels[model]) {
            this.dimension = knownModels[model].dimension;
        } else {
            this.dimension = await this.detectDimension();
        }
    }

    /**
     * Get list of supported models
     */
    static getSupportedModels(): Record<string, { dimension: number; description: string }> {
        return {
            'opencode-embed-v1': {
                dimension: 1536,
                description: 'OpenCode AI embedding model optimized for code understanding (recommended)'
            },
            'opencode-embed-large': {
                dimension: 3072,
                description: 'Large OpenCode AI embedding model with enhanced performance'
            },
            'opencode-code-embed': {
                dimension: 1024,
                description: 'Specialized model for code semantic search'
            }
        };
    }
}
