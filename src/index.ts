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

import {
  PersonaConfig,
  PersonaContext,
  PersonaResponse,
  ConversationMessage,
  TeamOptions,
  LLMAdapter,
  WorkflowStep,
  PersonaName,
  LayerName,
} from './types';
import {
  PERSONA_DEFINITIONS,
  getPersonasByTrigger,
  getPersona,
  LAYER_DEFINITIONS,
} from './personas/definitions';
import { MiniMaxAdapter, createMiniMaxAdapter } from './adapters';

export { MiniMaxAdapter, createMiniMaxAdapter } from './adapters';

// ========== Memory Layer ==========

export interface MemoryEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  persona?: string;
  timestamp: number;
  important?: boolean;
}

export class Memory {
  private entries: MemoryEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): void {
    this.entries.push({
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    });

    // Trim oldest non-important entries
    if (this.entries.length > this.maxEntries) {
      const removable = this.entries
        .filter(e => !e.important)
        .slice(0, this.entries.length - this.maxEntries);
      this.entries = this.entries.filter(e => !removable.includes(e));
    }
  }

  getRecent(count = 10): MemoryEntry[] {
    return this.entries.slice(-count);
  }

  getByPersona(persona: string): MemoryEntry[] {
    return this.entries.filter(e => e.persona === persona);
  }

  search(query: string): MemoryEntry[] {
    const lower = query.toLowerCase();
    return this.entries.filter(
      e => e.content.toLowerCase().includes(lower)
    );
  }

  clear(): void {
    this.entries = [];
  }

  get all(): MemoryEntry[] {
    return [...this.entries];
  }
}

// ========== Trigger Scorer ==========

/**
 * Score how well a persona's triggers match an input.
 * Uses a simple TF-IDF-like approach without external APIs.
 */
function scoreTriggers(persona: PersonaConfig, input: string): number {
  const inputLower = input.toLowerCase();
  const words = inputLower.split(/\s+/);

  let score = 0;
  for (const trigger of persona.triggers) {
    const triggerLower = trigger.toLowerCase();

    // Exact match in input words
    if (words.some(w => w === triggerLower)) {
      score += 3;
    }
    // Substring match
    else if (inputLower.includes(triggerLower)) {
      score += 1;
    }
  }

  // Boost for capability overlap
  for (const cap of persona.capabilities) {
    const capLower = cap.toLowerCase();
    if (inputLower.includes(capLower.split(' ')[0])) {
      score += 0.5;
    }
  }

  return score;
}

// ========== Hanwudi Team ==========

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

export class HanwudiTeam {
  private llm?: LLMAdapter;
  private maxIterations: number;
  private verbose: boolean;
  private activePersonas: Set<string> = new Set();
  private conversationHistory: ConversationMessage[] = [];
  private workflowSteps: WorkflowStep[] = [];
  private memory: Memory;
  private triggerThreshold: number;
  private maxAutoActivate: number;
  private enableMemory: boolean;

  constructor(config: HanwudiTeamConfig = {}) {
    this.llm = config.llm;
    this.maxIterations = config.maxIterations || 10;
    this.verbose = config.verbose || false;
    this.enableMemory = config.enableMemory ?? true;
    this.memory = new Memory();
    this.triggerThreshold = config.triggerThreshold ?? 1.5;
    this.maxAutoActivate = config.maxAutoActivate ?? 3;

    // Auto-configure MiniMax if apiKey provided
    if (config.minimaxApiKey || process.env.OPENAI_API_KEY || process.env.MINIMAX_API_KEY) {
      this.llm = createMiniMaxAdapter({
        apiKey: config.minimaxApiKey,
        baseUrl: config.minimaxBaseUrl,
      });
    }
  }

  // ========== Activation ==========

  /**
   * Auto-activate personas by semantic trigger scoring.
   * Better than simple keyword matching.
   */
  autoActivate(input: string): PersonaConfig[] {
    this.activePersonas.clear();

    const allPersonas = Object.values(PERSONA_DEFINITIONS);

    // Score all personas
    const scored = allPersonas
      .map(p => ({ persona: p, score: scoreTriggers(p, input) }))
      .filter(s => s.score >= this.triggerThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxAutoActivate);

    const activated: PersonaConfig[] = [];
    for (const { persona } of scored) {
      this.activePersonas.add(persona.name.toLowerCase());
      activated.push(persona);
      if (this.verbose) {
        console.log(`[Hanwudi] Auto-activated: ${persona.nameZh} (${persona.name}) score=${scored.find(s => s.persona === persona)!.score.toFixed(1)}`);
      }
    }

    return activated;
  }

  /**
   * Activate personas based on trigger keywords (legacy method)
   */
  activate(triggers: string | string[]): PersonaConfig[] {
    this.activePersonas.clear();

    const triggerList = Array.isArray(triggers) ? triggers : [triggers];
    const activated: PersonaConfig[] = [];

    for (const trigger of triggerList) {
      const personas = getPersonasByTrigger(trigger);
      for (const persona of personas) {
        if (!this.activePersonas.has(persona.name.toLowerCase())) {
          this.activePersonas.add(persona.name.toLowerCase());
          activated.push(persona);
          if (this.verbose) {
            console.log(`[Hanwudi] Activated: ${persona.nameZh} (${persona.name})`);
          }
        }
      }
    }

    return activated;
  }

  /**
   * Activate a specific persona by name
   */
  activatePersona(name: PersonaName): PersonaConfig | undefined {
    const persona = getPersona(name);
    if (persona) {
      this.activePersonas.add(name);
      if (this.verbose) {
        console.log(`[Hanwudi] Activated: ${persona.nameZh} (${persona.name})`);
      }
    }
    return persona;
  }

  /**
   * Activate all personas in a layer
   */
  activateLayer(layer: LayerName): PersonaConfig[] {
    const layerDef = LAYER_DEFINITIONS[layer];
    if (!layerDef) {
      if (this.verbose) console.log(`[Hanwudi] Unknown layer: ${layer}`);
      return [];
    }

    const activated: PersonaConfig[] = [];
    for (const name of layerDef.personas) {
      const persona = getPersona(name);
      if (persona) {
        this.activePersonas.add(name);
        activated.push(persona);
        if (this.verbose) {
          console.log(`[Hanwudi] Activated layer ${layer}: ${persona.nameZh}`);
        }
      }
    }
    return activated;
  }

  deactivateAll(): void {
    this.activePersonas.clear();
    if (this.verbose) console.log('[Hanwudi] All personas deactivated');
  }

  // ========== Processing ==========

  /**
   * Process input — auto-activates personas and runs them in parallel.
   */
  async process(input: string): Promise<PersonaResponse[]> {
    // Auto-activate if none are active
    if (this.activePersonas.size === 0) {
      this.autoActivate(input);
    }

    const context: PersonaContext = {
      input,
      history: [...this.conversationHistory],
      metadata: {
        memory: this.enableMemory ? this.memory.getRecent(5) : [],
      },
    };

    // Build persona list
    const personas: PersonaConfig[] = [];
    for (const name of this.activePersonas) {
      const persona = getPersona(name);
      if (persona) personas.push(persona);
    }

    if (personas.length === 0) {
      return [];
    }

    // Execute all personas (parallel)
    const results = await Promise.all(
      personas.map(p => this.executePersona(p, context))
    );

    // Add user input to history
    this.conversationHistory.push({ role: 'user', content: input });

    // Store in memory
    if (this.enableMemory) {
      for (const r of results) {
        this.memory.add({
          role: 'assistant',
          content: r.output,
          persona: r.persona,
        });
      }
      this.memory.add({ role: 'user', content: input });
    }

    return results;
  }

  /**
   * Execute a single persona with its role-specific prompt
   */
  private async executePersona(
    persona: PersonaConfig,
    context: PersonaContext
  ): Promise<PersonaResponse> {
    const prompt = this.buildPrompt(persona, context);

    if (this.llm) {
      const messages: ConversationMessage[] = [
        { role: 'system', content: prompt },
        ...context.history.slice(-8), // Keep more context
      ];

      try {
        const output = await this.llm.chat(messages);
        return {
          persona: persona.name,
          output,
          confidence: 0.9,
          suggestions: persona.capabilities.slice(0, 3),
        };
      } catch (err) {
        return {
          persona: persona.name,
          output: `[Error] ${err instanceof Error ? err.message : String(err)}`,
          confidence: 0,
          suggestions: persona.capabilities.slice(0, 3),
        };
      }
    }

    return {
      persona: persona.name,
      output: this.generateTemplateResponse(persona, context.input),
      confidence: 0.7,
      suggestions: persona.capabilities.slice(0, 3),
    };
  }

  /**
   * Build a role-specific system prompt
   */
  private buildPrompt(persona: PersonaConfig, context: PersonaContext): string {
    const memoryContext = context.metadata?.memory?.length
      ? `\nRecent context:\n${(context.metadata.memory as MemoryEntry[])
          .map(e => `[${e.persona || 'system'}]: ${e.content.slice(0, 100)}`)
          .join('\n')}`
      : '';

    return `You are ${persona.nameZh} (${persona.name}), ${persona.role}.

## Your Role
You are an expert in your domain. Provide thoughtful, specific, and actionable responses.

## Your Capabilities
${persona.capabilities.map(c => `- ${c}`).join('\n')}

## Current Task
${context.input}

${memoryContext}

## Response Guidelines
- Be specific and detailed in your response
- If writing code, include comments
- For strategy/planning, use bullet points
- Stay in character as ${persona.nameZh}`;
  }

  private generateTemplateResponse(persona: PersonaConfig, input: string): string {
    return `[${persona.nameZh}] I'm ready to help with: "${input}"

As the ${persona.role}, I specialize in:
${persona.capabilities.slice(0, 3).map(c => `- ${c}`).join('\n')}

**Note:** No LLM configured. Please set your API key to enable full functionality.

Set environment variable OPENAI_API_KEY or MINIMAX_API_KEY, then:
  const adapter = new MiniMaxAdapter({ apiKey: 'your-key' });
  team.setLLM(adapter);`;
  }

  // ========== Workflow ==========

  /**
   * Run a structured SOP workflow with ordered steps.
   */
  async runWorkflow(
    input: string,
    steps?: string[],
    options: { parallel?: boolean } = {}
  ): Promise<WorkflowStep[]> {
    this.workflowSteps = [];

    const workflowOrder = steps || [
      'scholar',    // 1. Research
      'strategist', // 2. Plan
      'doctor',     // 3. Review/Diagnose
      'general',    // 4. Implement
      'censor',     // 5. Document
      'inspector',  // 6. QA
      'physician',  // 7. Fix issues
    ];

    if (options.parallel) {
      // Execute all steps in parallel with the same input
      const results = await Promise.all(
        workflowOrder.map(personaName => this.executePersonaStep(personaName, input))
      );
      this.workflowSteps = results;
    } else {
      // Sequential SOP
      for (const personaName of workflowOrder) {
        const step = await this.executePersonaStep(personaName, input);
        this.workflowSteps.push(step);
      }
    }

    return this.workflowSteps;
  }

  private async executePersonaStep(personaName: string, input: string): Promise<WorkflowStep> {
    const persona = getPersona(personaName);
    const step: WorkflowStep = {
      id: `step_${this.workflowSteps.length + 1}`,
      persona: personaName,
      input,
    };

    if (!persona) {
      step.output = {
        persona: personaName,
        output: `[Error] Persona "${personaName}" not found`,
        confidence: 0,
      };
      return step;
    }

    const context: PersonaContext = {
      input,
      history: this.conversationHistory,
      metadata: { step: step.id },
    };

    const response = await this.executePersona(persona, context);
    step.output = response;
    return step;
  }

  // ========== LLM Management ==========

  setLLM(llm: LLMAdapter): void {
    this.llm = llm;
  }

  /** Shortcut: connect MiniMax with just an API key */
  connectMiniMax(apiKey?: string, baseUrl?: string): MiniMaxAdapter {
    const adapter = createMiniMaxAdapter({ apiKey, baseUrl });
    this.llm = adapter;
    return adapter;
  }

  // ========== Introspection ==========

  listPersonas(): PersonaConfig[] {
    return Object.values(PERSONA_DEFINITIONS);
  }

  getLayerPersonas(layer: LayerName): PersonaConfig[] {
    const layerDef = LAYER_DEFINITIONS[layer];
    if (!layerDef) return [];
    return layerDef.personas.map(name => getPersona(name)).filter(Boolean) as PersonaConfig[];
  }

  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getMemory(): Memory {
    return this.memory;
  }

  getActivePersonas(): string[] {
    return Array.from(this.activePersonas);
  }
}

export default HanwudiTeam;
