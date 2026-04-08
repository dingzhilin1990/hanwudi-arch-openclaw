/**
 * Hanwudi Team - Core Types
 */
export interface PersonaConfig {
    name: string;
    nameZh: string;
    role: string;
    triggers: string[];
    capabilities: string[];
}
export interface PersonaContext {
    input: string;
    history: ConversationMessage[];
    metadata: Record<string, any>;
}
export interface PersonaResponse {
    persona: string;
    output: string;
    confidence: number;
    suggestions?: string[];
}
export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    persona?: string;
}
export interface TeamOptions {
    llm?: LLMAdapter;
    maxIterations?: number;
    verbose?: boolean;
}
export interface LLMAdapter {
    chat(messages: ConversationMessage[]): Promise<string>;
    chatStream(messages: ConversationMessage[], onChunk: (chunk: string) => void): Promise<void>;
}
export interface WorkflowStep {
    id: string;
    persona: string;
    input: string;
    output?: PersonaResponse;
}
export type PersonaName = 'strategist' | 'scholar' | 'doctor' | 'general' | 'chancellor' | 'censor' | 'inspector' | 'physician';
export type LayerName = 'zhongchao' | 'waichao' | 'cishi';
//# sourceMappingURL=index.d.ts.map