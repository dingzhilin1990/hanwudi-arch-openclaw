/**
 * Hanwudi Team - Main Orchestration
 * AI Agent Team with 8 specialized personas
 *
 * Improvements over original:
 * - Semantic trigger scoring (not just keyword presence)
 * - Memory/context layer
 * - Better streaming support
 * - Role-specific prompt engineering
 */
import { PersonaConfig, PersonaResponse, ConversationMessage, TeamOptions, LLMAdapter, WorkflowStep, PersonaName, LayerName } from './types';
import { MiniMaxAdapter } from './adapters';
export { MiniMaxAdapter, createMiniMaxAdapter } from './adapters';
export interface MemoryEntry {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    persona?: string;
    timestamp: number;
    important?: boolean;
}
export declare class Memory {
    private entries;
    private maxEntries;
    constructor(maxEntries?: number);
    add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): void;
    getRecent(count?: number): MemoryEntry[];
    getByPersona(persona: string): MemoryEntry[];
    search(query: string): MemoryEntry[];
    clear(): void;
    get all(): MemoryEntry[];
}
export interface HanwudiTeamConfig extends TeamOptions {
    /** Minimum trigger score to auto-activate a persona (default: 1.5) */
    triggerThreshold?: number;
    /** Maximum persona to activate from auto-trigger (default: 3) */
    maxAutoActivate?: number;
    /** Enable memory layer (default: true) */
    enableMemory?: boolean;
    /** MiniMax API key (overrides env var) */
    minimaxApiKey?: string;
    /** MiniMax base URL */
    minimaxBaseUrl?: string;
}
export declare class HanwudiTeam {
    private llm?;
    private maxIterations;
    private verbose;
    private activePersonas;
    private conversationHistory;
    private workflowSteps;
    private memory;
    private triggerThreshold;
    private maxAutoActivate;
    private enableMemory;
    constructor(config?: HanwudiTeamConfig);
    /**
     * Auto-activate personas by semantic trigger scoring.
     * Better than simple keyword matching.
     */
    autoActivate(input: string): PersonaConfig[];
    /**
     * Activate personas based on trigger keywords (legacy method)
     */
    activate(triggers: string | string[]): PersonaConfig[];
    /**
     * Activate a specific persona by name
     */
    activatePersona(name: PersonaName): PersonaConfig | undefined;
    /**
     * Activate all personas in a layer
     */
    activateLayer(layer: LayerName): PersonaConfig[];
    deactivateAll(): void;
    /**
     * Process input — auto-activates personas and runs them in parallel.
     */
    process(input: string): Promise<PersonaResponse[]>;
    /**
     * Execute a single persona with its role-specific prompt
     */
    private executePersona;
    /**
     * Build a role-specific system prompt
     */
    private buildPrompt;
    private generateTemplateResponse;
    /**
     * Run a structured SOP workflow with ordered steps.
     */
    runWorkflow(input: string, steps?: string[], options?: {
        parallel?: boolean;
    }): Promise<WorkflowStep[]>;
    private executePersonaStep;
    setLLM(llm: LLMAdapter): void;
    /** Shortcut: connect MiniMax with just an API key */
    connectMiniMax(apiKey?: string, baseUrl?: string): MiniMaxAdapter;
    listPersonas(): PersonaConfig[];
    getLayerPersonas(layer: LayerName): PersonaConfig[];
    getHistory(): ConversationMessage[];
    clearHistory(): void;
    getMemory(): Memory;
    getActivePersonas(): string[];
}
export default HanwudiTeam;
//# sourceMappingURL=index.d.ts.map