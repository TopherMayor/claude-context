export interface OpenCodeConfigOptions {
    /**
     * When true, inject actual environment variable values into the generated config.
     * When false (default), placeholders using `{env:VAR_NAME}` are emitted.
     */
    includeEnvValues?: boolean;
    /**
     * Name of the MCP entry inside the OpenCode config.
     * Defaults to `claude-context`.
     */
    providerId?: string;
    /**
     * Include a tools section that pre-enables the Claude Context tools.
     * Defaults to true.
     */
    includeToolsSection?: boolean;
}

const DEFAULT_PROVIDER_ID = 'claude-context';

// Environment variables that are strongly recommended for configuration.
const REQUIRED_ENV_VARS = [
    'MILVUS_TOKEN',
] as const;

// Additional optional environment variables that users may want to set.
const OPTIONAL_ENV_VARS = [
    'MILVUS_ADDRESS',
    'EMBEDDING_PROVIDER',
    'EMBEDDING_MODEL',
    'OPENAI_API_KEY',
    'OPENAI_BASE_URL',
    'VOYAGEAI_API_KEY',
    'GEMINI_API_KEY',
    'GEMINI_BASE_URL',
    'OLLAMA_MODEL',
    'OLLAMA_HOST',
    'CUSTOM_EXTENSIONS',
    'CUSTOM_IGNORE_PATTERNS',
    'HYBRID_MODE',
    'EMBEDDING_BATCH_SIZE'
] as const;

const ALWAYS_INCLUDED_OPTIONAL_ENV_VARS = [
    'MILVUS_ADDRESS',
    'EMBEDDING_PROVIDER',
    'EMBEDDING_MODEL'
] as const;

type EnvVarName = typeof REQUIRED_ENV_VARS[number] | typeof OPTIONAL_ENV_VARS[number];

interface BuildConfigOptions extends OpenCodeConfigOptions {
    includeEnvValues: boolean;
    providerId: string;
    includeToolsSection: boolean;
}

const DEFAULT_BUILD_OPTIONS: BuildConfigOptions = {
    includeEnvValues: false,
    providerId: DEFAULT_PROVIDER_ID,
    includeToolsSection: true
};

function buildEnvironmentMap(options: BuildConfigOptions): Record<string, string> {
    const environment: Record<string, string> = {};
    const addEnvVar = (name: EnvVarName, alwaysInclude: boolean) => {
        const actualValue = process.env[name];
        if (alwaysInclude || typeof actualValue === 'string') {
            environment[name] = options.includeEnvValues && typeof actualValue === 'string'
                ? actualValue
                : `{env:${name}}`;
        }
    };

    REQUIRED_ENV_VARS.forEach((name) => addEnvVar(name, true));
    OPTIONAL_ENV_VARS.forEach((name) => {
        const alwaysInclude = (ALWAYS_INCLUDED_OPTIONAL_ENV_VARS as readonly string[]).includes(name);
        addEnvVar(name, alwaysInclude);
    });

    return environment;
}

export function buildOpenCodeConfig(options: OpenCodeConfigOptions = {}) {
    const mergedOptions: BuildConfigOptions = {
        ...DEFAULT_BUILD_OPTIONS,
        ...options,
        includeEnvValues: options.includeEnvValues ?? DEFAULT_BUILD_OPTIONS.includeEnvValues,
        providerId: options.providerId ?? DEFAULT_BUILD_OPTIONS.providerId,
        includeToolsSection: options.includeToolsSection ?? DEFAULT_BUILD_OPTIONS.includeToolsSection
    };

    const environment = buildEnvironmentMap(mergedOptions);

    const mcpEntry: Record<string, any> = {
        type: 'local',
        command: ['npx', '-y', '@zilliz/claude-context-mcp@latest'],
        timeout: 20000,
        enabled: true
    };

    if (Object.keys(environment).length > 0) {
        mcpEntry.environment = environment;
    }

    const config: Record<string, any> = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
            [mergedOptions.providerId]: mcpEntry
        }
    };

    if (mergedOptions.includeToolsSection) {
        config.tools = {
            [`${mergedOptions.providerId}*`]: true
        };
    }

    return config;
}

export function renderOpenCodeConfig(options: OpenCodeConfigOptions = {}): string {
    const config = buildOpenCodeConfig(options);
    return JSON.stringify(config, null, 2);
}
