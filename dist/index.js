"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HanwudiTeam = exports.Memory = exports.createMiniMaxAdapter = exports.MiniMaxAdapter = void 0;
const definitions_1 = require("./personas/definitions");
const adapters_1 = require("./adapters");
var adapters_2 = require("./adapters");
Object.defineProperty(exports, "MiniMaxAdapter", { enumerable: true, get: function () { return adapters_2.MiniMaxAdapter; } });
Object.defineProperty(exports, "createMiniMaxAdapter", { enumerable: true, get: function () { return adapters_2.createMiniMaxAdapter; } });
class Memory {
    constructor(maxEntries = 100) {
        this.entries = [];
        this.maxEntries = maxEntries;
    }
    add(entry) {
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
    getRecent(count = 10) {
        return this.entries.slice(-count);
    }
    getByPersona(persona) {
        return this.entries.filter(e => e.persona === persona);
    }
    search(query) {
        const lower = query.toLowerCase();
        return this.entries.filter(e => e.content.toLowerCase().includes(lower));
    }
    clear() {
        this.entries = [];
    }
    get all() {
        return [...this.entries];
    }
}
exports.Memory = Memory;
// ========== Trigger Scorer ==========
/**
 * Score how well a persona's triggers match an input.
 * Uses a simple TF-IDF-like approach without external APIs.
 */
function scoreTriggers(persona, input) {
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
class HanwudiTeam {
    constructor(config = {}) {
        this.activePersonas = new Set();
        this.conversationHistory = [];
        this.workflowSteps = [];
        this.llm = config.llm;
        this.maxIterations = config.maxIterations || 10;
        this.verbose = config.verbose || false;
        this.enableMemory = config.enableMemory ?? true;
        this.memory = new Memory();
        this.triggerThreshold = config.triggerThreshold ?? 1.5;
        this.maxAutoActivate = config.maxAutoActivate ?? 3;
        // Auto-configure MiniMax if apiKey provided
        if (config.minimaxApiKey || process.env.OPENAI_API_KEY || process.env.MINIMAX_API_KEY) {
            this.llm = (0, adapters_1.createMiniMaxAdapter)({
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
    autoActivate(input) {
        this.activePersonas.clear();
        const allPersonas = Object.values(definitions_1.PERSONA_DEFINITIONS);
        // Score all personas
        const scored = allPersonas
            .map(p => ({ persona: p, score: scoreTriggers(p, input) }))
            .filter(s => s.score >= this.triggerThreshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, this.maxAutoActivate);
        const activated = [];
        for (const { persona } of scored) {
            this.activePersonas.add(persona.name.toLowerCase());
            activated.push(persona);
            if (this.verbose) {
                console.log(`[Hanwudi] Auto-activated: ${persona.nameZh} (${persona.name}) score=${scored.find(s => s.persona === persona).score.toFixed(1)}`);
            }
        }
        return activated;
    }
    /**
     * Activate personas based on trigger keywords (legacy method)
     */
    activate(triggers) {
        this.activePersonas.clear();
        const triggerList = Array.isArray(triggers) ? triggers : [triggers];
        const activated = [];
        for (const trigger of triggerList) {
            const personas = (0, definitions_1.getPersonasByTrigger)(trigger);
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
    activatePersona(name) {
        const persona = (0, definitions_1.getPersona)(name);
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
    activateLayer(layer) {
        const layerDef = definitions_1.LAYER_DEFINITIONS[layer];
        if (!layerDef) {
            if (this.verbose)
                console.log(`[Hanwudi] Unknown layer: ${layer}`);
            return [];
        }
        const activated = [];
        for (const name of layerDef.personas) {
            const persona = (0, definitions_1.getPersona)(name);
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
    deactivateAll() {
        this.activePersonas.clear();
        if (this.verbose)
            console.log('[Hanwudi] All personas deactivated');
    }
    // ========== Processing ==========
    /**
     * Process input — auto-activates personas and runs them in parallel.
     */
    async process(input) {
        // Auto-activate if none are active
        if (this.activePersonas.size === 0) {
            this.autoActivate(input);
        }
        const context = {
            input,
            history: [...this.conversationHistory],
            metadata: {
                memory: this.enableMemory ? this.memory.getRecent(5) : [],
            },
        };
        // Build persona list
        const personas = [];
        for (const name of this.activePersonas) {
            const persona = (0, definitions_1.getPersona)(name);
            if (persona)
                personas.push(persona);
        }
        if (personas.length === 0) {
            return [];
        }
        // Execute all personas (parallel)
        const results = await Promise.all(personas.map(p => this.executePersona(p, context)));
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
    async executePersona(persona, context) {
        const prompt = this.buildPrompt(persona, context);
        if (this.llm) {
            const messages = [
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
            }
            catch (err) {
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
    buildPrompt(persona, context) {
        const memoryContext = context.metadata?.memory?.length
            ? `\nRecent context:\n${context.metadata.memory
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
    generateTemplateResponse(persona, input) {
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
    async runWorkflow(input, steps, options = {}) {
        this.workflowSteps = [];
        const workflowOrder = steps || [
            'scholar', // 1. Research
            'strategist', // 2. Plan
            'doctor', // 3. Review/Diagnose
            'general', // 4. Implement
            'censor', // 5. Document
            'inspector', // 6. QA
            'physician', // 7. Fix issues
        ];
        if (options.parallel) {
            // Execute all steps in parallel with the same input
            const results = await Promise.all(workflowOrder.map(personaName => this.executePersonaStep(personaName, input)));
            this.workflowSteps = results;
        }
        else {
            // Sequential SOP
            for (const personaName of workflowOrder) {
                const step = await this.executePersonaStep(personaName, input);
                this.workflowSteps.push(step);
            }
        }
        return this.workflowSteps;
    }
    async executePersonaStep(personaName, input) {
        const persona = (0, definitions_1.getPersona)(personaName);
        const step = {
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
        const context = {
            input,
            history: this.conversationHistory,
            metadata: { step: step.id },
        };
        const response = await this.executePersona(persona, context);
        step.output = response;
        return step;
    }
    // ========== LLM Management ==========
    setLLM(llm) {
        this.llm = llm;
    }
    /** Shortcut: connect MiniMax with just an API key */
    connectMiniMax(apiKey, baseUrl) {
        const adapter = (0, adapters_1.createMiniMaxAdapter)({ apiKey, baseUrl });
        this.llm = adapter;
        return adapter;
    }
    // ========== Introspection ==========
    listPersonas() {
        return Object.values(definitions_1.PERSONA_DEFINITIONS);
    }
    getLayerPersonas(layer) {
        const layerDef = definitions_1.LAYER_DEFINITIONS[layer];
        if (!layerDef)
            return [];
        return layerDef.personas.map(name => (0, definitions_1.getPersona)(name)).filter(Boolean);
    }
    getHistory() {
        return [...this.conversationHistory];
    }
    clearHistory() {
        this.conversationHistory = [];
    }
    getMemory() {
        return this.memory;
    }
    getActivePersonas() {
        return Array.from(this.activePersonas);
    }
}
exports.HanwudiTeam = HanwudiTeam;
exports.default = HanwudiTeam;
