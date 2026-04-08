/**
 * Hanwudi Team - Unit Tests
 */

import { HanwudiTeam, Memory } from '../src/index';
import { PERSONA_DEFINITIONS } from '../src/personas/definitions';

// ============================================================
// Memory Tests
// ============================================================

describe('Memory', () => {
  let memory: Memory;

  beforeEach(() => {
    memory = new Memory(10);
  });

  test('should add and retrieve entries', () => {
    memory.add({ role: 'user', content: 'Hello' });
    memory.add({ role: 'assistant', content: 'Hi there' });

    const recent = memory.getRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].content).toBe('Hello');
    expect(recent[1].content).toBe('Hi there');
  });

  test('should search by content', () => {
    memory.add({ role: 'user', content: 'Build a login system' });
    memory.add({ role: 'user', content: 'Add user registration' });

    const results = memory.search('login');
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('Build a login system');
  });

  test('should filter by persona', () => {
    memory.add({ role: 'assistant', content: 'Code result', persona: 'general' });
    memory.add({ role: 'assistant', content: 'Plan result', persona: 'strategist' });

    const general = memory.getByPersona('general');
    expect(general).toHaveLength(1);
    expect(general[0].content).toBe('Code result');
  });

  test('should clear all entries', () => {
    memory.add({ role: 'user', content: 'Test' });
    memory.clear();
    expect(memory.all).toHaveLength(0);
  });
});

// ============================================================
// Persona Tests
// ============================================================

describe('Personas', () => {
  test('should have 8 personas defined', () => {
    expect(Object.keys(PERSONA_DEFINITIONS)).toHaveLength(8);
  });

  test('each persona should have required fields', () => {
    for (const [name, persona] of Object.entries(PERSONA_DEFINITIONS)) {
      expect(persona.name).toBeTruthy();
      expect(persona.nameZh).toBeTruthy();
      expect(persona.role).toBeTruthy();
      expect(Array.isArray(persona.triggers)).toBe(true);
      expect(persona.triggers.length).toBeGreaterThan(0);
      expect(Array.isArray(persona.capabilities)).toBe(true);
      expect(persona.capabilities.length).toBeGreaterThan(0);
    }
  });

  test('persona names should be unique', () => {
    const names = Object.values(PERSONA_DEFINITIONS).map(p => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// ============================================================
// Team Tests
// ============================================================

describe('HanwudiTeam', () => {
  let team: HanwudiTeam;

  beforeEach(() => {
    team = new HanwudiTeam({ verbose: false });
  });

  test('should create team with defaults', () => {
    expect(team).toBeTruthy();
  });

  test('should list all personas', () => {
    const personas = team.listPersonas();
    expect(personas).toHaveLength(8);
  });

  test('should activate personas by name', () => {
    const p = team.activatePersona('general');
    expect(p?.name).toBe('General');
    expect(team.getActivePersonas()).toContain('general');
  });

  test('should activate layer personas', () => {
    const activated = team.activateLayer('zhongchao');
    expect(activated).toHaveLength(3);
    expect(team.getActivePersonas()).toContain('strategist');
    expect(team.getActivePersonas()).toContain('scholar');
    expect(team.getActivePersonas()).toContain('doctor');
  });

  test('should deactivate all personas', () => {
    team.activatePersona('general');
    team.deactivateAll();
    expect(team.getActivePersonas()).toHaveLength(0);
  });

  test('should auto-activate based on trigger scoring', () => {
    const activated = team.autoActivate('I need to write code and debug it');
    expect(activated.length).toBeGreaterThan(0);
    expect(activated.some(p => p.name === 'General')).toBe(true);
  });

  test('should process without LLM (template mode)', async () => {
    team.activatePersona('general');
    const results = await team.process('Build a calculator');
    expect(results).toHaveLength(1);
    expect(results[0].persona).toBe('General');
    expect(results[0].confidence).toBeLessThan(1); // template mode
  });

  test('should accumulate history', async () => {
    team.activatePersona('scholar');
    await team.process('Research AI trends');
    const history = team.getHistory();
    expect(history.some(m => m.role === 'user')).toBe(true);
  });

  test('should use memory layer', async () => {
    team.activatePersona('scholar');
    await team.process('Learn about TypeScript');
    const memory = team.getMemory();
    expect(memory.all.length).toBeGreaterThan(0);
  });

  test('should run workflow', async () => {
    team.activatePersona('scholar');
    team.activatePersona('general');
    const steps = await team.runWorkflow('Create a web server', ['scholar', 'general']);
    expect(steps).toHaveLength(2);
    expect(steps[0].persona).toBe('scholar');
    expect(steps[1].persona).toBe('general');
  });
});
