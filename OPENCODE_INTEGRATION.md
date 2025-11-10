# OpenCode AI Integration Summary

This document summarizes the integration of OpenCode AI into the Claude Context project.

## Overview

OpenCode AI has been successfully integrated as a native embedding provider for Claude Context, allowing users to leverage OpenCode AI's specialized code embeddings for semantic code search.

## Changes Made

### 1. Core Package (`packages/core`)

#### New Files
- **`packages/core/src/embedding/opencode-embedding.ts`**
  - Implements the `OpenCodeEmbedding` class following the existing embedding provider pattern
  - Supports OpenAI-compatible API format for easy integration
  - Includes three default models: `opencode-embed-v1`, `opencode-embed-large`, `opencode-code-embed`
  - Provides automatic dimension detection for custom models
  - Uses native fetch API (no additional dependencies required)

#### Modified Files
- **`packages/core/src/embedding/index.ts`**
  - Added export for `OpenCodeEmbedding` class

- **`packages/core/README.md`**
  - Added OpenCode AI to the list of supported embedding providers

### 2. MCP Package (`packages/mcp`)

#### Modified Files
- **`packages/mcp/src/config.ts`**
  - Updated `ContextMcpConfig` interface to include OpenCode configuration:
    - `opencodeApiKey?: string`
    - `opencodeBaseUrl?: string`
  - Updated `embeddingProvider` type to include `'OpenCode'`
  - Added `getDefaultModelForProvider` support for OpenCode (default: `opencode-embed-v1`)
  - Updated configuration creation and logging to support OpenCode
  - Added OpenCode AI example to help message

- **`packages/mcp/src/embedding.ts`**
  - Added `OpenCodeEmbedding` to imports
  - Updated `createEmbeddingInstance` function to handle OpenCode provider
  - Updated `logEmbeddingProviderInfo` function to display OpenCode configuration
  - Added proper type annotations to include `OpenCodeEmbedding`

- **`packages/mcp/README.md`**
  - Added comprehensive OpenCode AI configuration section
  - Included setup instructions with API key acquisition guide
  - Added configuration examples for Cursor and other MCP clients
  - Referenced OpenCode AI documentation at https://opencode.ai/docs

### 3. Documentation

#### Modified Files
- **`README.md`**
  - Added OpenCode AI to the list of supported embedding providers in the "Supported Technologies" section

- **`docs/getting-started/environment-variables.md`**
  - Added OpenCode AI environment variables to the provider table:
    - `OPENCODE_API_KEY` - Required for OpenCode provider
    - `OPENCODE_BASE_URL` - Optional, for custom endpoints

- **`.env.example`**
  - Added OpenCode AI configuration section with example environment variables
  - Included comments referencing OpenCode AI documentation

### 4. Build Verification

All packages build successfully:
- ✅ Core package builds without errors
- ✅ MCP package builds without errors
- ✅ Chrome extension builds without errors
- ✅ Example projects build without errors
- ✅ OpenCode embedding classes are properly exported and compiled

## Usage

### Environment Variables

To use OpenCode AI as an embedding provider, set the following environment variables:

```bash
# Required
EMBEDDING_PROVIDER=OpenCode
OPENCODE_API_KEY=your-opencode-api-key

# Optional
EMBEDDING_MODEL=opencode-embed-v1  # Default model
OPENCODE_BASE_URL=https://api.opencode.ai/v1  # Custom endpoint

# Vector Database (still required)
MILVUS_TOKEN=your-zilliz-cloud-api-key
```

### MCP Configuration Example (Cursor)

```json
{
  "mcpServers": {
    "claude-context": {
      "command": "npx",
      "args": ["-y", "@zilliz/claude-context-mcp@latest"],
      "env": {
        "EMBEDDING_PROVIDER": "OpenCode",
        "OPENCODE_API_KEY": "your-opencode-api-key",
        "EMBEDDING_MODEL": "opencode-embed-v1",
        "MILVUS_TOKEN": "your-zilliz-cloud-api-key"
      }
    }
  }
}
```

### Programmatic Usage (Core Package)

```typescript
import { Context, OpenCodeEmbedding, MilvusVectorDatabase } from '@zilliz/claude-context-core';

// Initialize OpenCode AI embedding provider
const embedding = new OpenCodeEmbedding({
  apiKey: process.env.OPENCODE_API_KEY || 'your-opencode-api-key',
  model: 'opencode-embed-v1',
  baseURL: 'https://api.opencode.ai/v1' // Optional
});

// Initialize vector database
const vectorDatabase = new MilvusVectorDatabase({
  address: process.env.MILVUS_ADDRESS || 'your-zilliz-cloud-public-endpoint',
  token: process.env.MILVUS_TOKEN || 'your-zilliz-cloud-api-key'
});

// Create context instance
const context = new Context({
  embedding,
  vectorDatabase
});

// Use as normal
await context.indexCodebase('./your-project');
const results = await context.semanticSearch('./your-project', 'authentication functions', 5);
```

## Supported Models

The OpenCode AI integration includes three default models:

1. **opencode-embed-v1** (default)
   - Dimension: 1536
   - Description: OpenCode AI embedding model optimized for code understanding

2. **opencode-embed-large**
   - Dimension: 3072
   - Description: Large OpenCode AI embedding model with enhanced performance

3. **opencode-code-embed**
   - Dimension: 1024
   - Description: Specialized model for code semantic search

Custom models are also supported with automatic dimension detection.

## API Compatibility

The OpenCode AI integration uses an OpenAI-compatible API format:

- **Endpoint**: `POST /v1/embeddings`
- **Authentication**: Bearer token via `Authorization` header
- **Request Format**: Follows OpenAI embedding API schema
- **Response Format**: Compatible with OpenAI embedding response

This design allows for easy integration with OpenCode AI or any OpenAI-compatible embedding service.

## Getting Started with OpenCode AI

1. Visit [OpenCode AI Documentation](https://opencode.ai/docs)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key
5. Use the API key in your environment configuration

## Testing

The integration has been verified:
- ✅ TypeScript compilation successful
- ✅ All packages build without errors
- ✅ Exports are properly configured
- ✅ Configuration is properly typed
- ✅ Documentation is comprehensive

## Notes

- OpenCode AI requires an active API key from https://opencode.ai
- The base URL can be customized for custom endpoints or proxies
- All existing functionality remains unchanged
- OpenCode AI can be used alongside other embedding providers
- No breaking changes to existing APIs
