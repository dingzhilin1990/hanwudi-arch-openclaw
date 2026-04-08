"use strict";
/**
 * MiniMax LLM Adapter
 * Connects Hanwudi Team to MiniMax API
 *
 * Supports:
 * - MiniMax-M2.5 (fast, default)
 * - MiniMax-Text-01 (long context, 200K)
 * - kimi-code/kimi-for-codi (code tasks)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxAdapter = void 0;
exports.createMiniMaxAdapter = createMiniMaxAdapter;
class MiniMaxAdapter {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || process.env.MINIMAX_API_KEY || '';
        this.baseUrl = config.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.minimax.chat/v1';
        this.model = config.model || MiniMaxAdapter.MODELS.default;
        this.temperature = config.temperature ?? 0.7;
        this.maxTokens = config.maxTokens ?? 4096;
    }
    /**
     * Auto-select optimal model based on content
     */
    selectModel(messages) {
        const lastMessage = messages[messages.length - 1]?.content || '';
        const allContent = JSON.stringify(messages);
        if (allContent.toLowerCase().includes('code') ||
            allContent.toLowerCase().includes('function') ||
            allContent.toLowerCase().includes('implement') ||
            allContent.toLowerCase().includes('debug')) {
            return MiniMaxAdapter.MODELS.code;
        }
        if (lastMessage.length > 8000) {
            return MiniMaxAdapter.MODELS.long;
        }
        return this.model;
    }
    /**
     * Convert ConversationMessage[] to OpenAI format
     */
    toOpenAIMessages(messages) {
        return messages.map(m => ({
            role: m.role,
            content: m.content,
            ...(m.persona && { name: m.persona }),
        }));
    }
    /**
     * Make an HTTP request to the MiniMax API
     */
    async chatInternal(messages, options = {}) {
        if (!this.apiKey) {
            throw new Error('MiniMax API key not set. Pass apiKey in config or set OPENAI_API_KEY / MINIMAX_API_KEY env var.');
        }
        const model = options.model || this.selectModel(messages);
        const temperature = options.temperature ?? this.temperature;
        const maxTokens = options.maxTokens ?? this.maxTokens;
        const url = `${this.baseUrl}/chat/completions`;
        const body = {
            model,
            messages: this.toOpenAIMessages(messages),
            temperature,
            max_tokens: maxTokens,
        };
        if (options.stream) {
            body.stream = true;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`MiniMax API error ${response.status}: ${error}`);
        }
        if (options.stream && options.onChunk) {
            // Handle streaming
            const reader = response.body?.getReader();
            if (!reader)
                throw new Error('No response body');
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]')
                        continue;
                    if (trimmed.startsWith('data: ')) {
                        const data = trimmed.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content)
                                options.onChunk(content);
                        }
                        catch {
                            // Skip malformed JSON
                        }
                    }
                }
            }
            return '';
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
    /**
     * Standard chat (non-streaming)
     */
    async chat(messages) {
        return this.chatInternal(messages, { stream: false });
    }
    /**
     * Streaming chat
     */
    async chatStream(messages, onChunk) {
        await this.chatInternal(messages, { stream: true, onChunk });
    }
    /**
     * Update configuration at runtime
     */
    updateConfig(config) {
        if (config.apiKey !== undefined)
            this.apiKey = config.apiKey;
        if (config.baseUrl !== undefined)
            this.baseUrl = config.baseUrl;
        if (config.model !== undefined)
            this.model = config.model;
        if (config.temperature !== undefined)
            this.temperature = config.temperature;
        if (config.maxTokens !== undefined)
            this.maxTokens = config.maxTokens;
    }
    /**
     * Check if the API key is configured
     */
    isConfigured() {
        return Boolean(this.apiKey);
    }
}
exports.MiniMaxAdapter = MiniMaxAdapter;
// Model recommendations
MiniMaxAdapter.MODELS = {
    fast: 'MiniMax-M2.5',
    long: 'MiniMax-Text-01',
    code: 'kimi-code/kimi-for-codi',
    default: 'MiniMax-M2.5',
};
/**
 * Factory to create a configured adapter from env vars
 */
function createMiniMaxAdapter(config) {
    return new MiniMaxAdapter(config);
}
