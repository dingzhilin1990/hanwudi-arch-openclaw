/**
 * MiniMax LLM Adapter
 * Connects Hanwudi Team to MiniMax API
 *
 * Supports:
 * - MiniMax-M2.5 (fast, default)
 * - MiniMax-Text-01 (long context, 200K)
 * - kimi-code/kimi-for-codi (code tasks)
 */
import { LLMAdapter, ConversationMessage } from '../types';
export interface MiniMaxConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export declare class MiniMaxAdapter implements LLMAdapter {
    private apiKey;
    private baseUrl;
    private model;
    private temperature;
    private maxTokens;
    static MODELS: {
        fast: string;
        long: string;
        code: string;
        default: string;
    };
    constructor(config?: MiniMaxConfig);
    /**
     * Auto-select optimal model based on content
     */
    private selectModel;
    /**
     * Convert ConversationMessage[] to OpenAI format
     */
    private toOpenAIMessages;
    /**
     * Make an HTTP request to the MiniMax API
     */
    private chatInternal;
    /**
     * Standard chat (non-streaming)
     */
    chat(messages: ConversationMessage[]): Promise<string>;
    /**
     * Streaming chat
     */
    chatStream(messages: ConversationMessage[], onChunk: (chunk: string) => void): Promise<void>;
    /**
     * Update configuration at runtime
     */
    updateConfig(config: Partial<MiniMaxConfig>): void;
    /**
     * Check if the API key is configured
     */
    isConfigured(): boolean;
}
/**
 * Factory to create a configured adapter from env vars
 */
export declare function createMiniMaxAdapter(config?: MiniMaxConfig): MiniMaxAdapter;
//# sourceMappingURL=minimax.d.ts.map