/**
 * Hanwudi Team - MiniMax Integration Example
 * 
 * This example shows how to:
 * 1. Connect to MiniMax API
 * 2. Use auto-activation (semantic trigger scoring)
 * 3. Run a structured workflow
 */

import { HanwudiTeam, createMiniMaxAdapter } from '../dist/index.js';

// ============================================================
// Option 1: Auto-connect with env vars
// ============================================================
// Set these in your environment:
//   OPENAI_API_KEY=your-minimax-key
//   OPENAI_BASE_URL=https://api.minimax.chat/v1
//
// Then just create the team with no args:
//   const team = new HanwudiTeam({ verbose: true });

// ============================================================
// Option 2: Explicit API key
// ============================================================

const apiKey = process.env.OPENAI_API_KEY || process.env.MINIMAX_API_KEY;

if (!apiKey) {
  console.log('⚠️  No API key found. Running in template mode (no real LLM).');
  console.log('   Set OPENAI_API_KEY env var or pass apiKey to connectMiniMax().\n');

  const templateTeam = new HanwudiTeam({ verbose: true });

  // Demo: auto-activate personas from natural language
  console.log('=== Auto-Activation Demo ===');
  const activated = templateTeam.autoActivate(
    'I need to build a user authentication system with strategy planning'
  );
  console.log('Auto-activated personas:', activated.map(p => p.nameZh));
  console.log('');

  const results = await templateTeam.process('Build a REST API for a blog');
  results.forEach(r => {
    console.log(`\n[${r.persona}]:\n${r.output.slice(0, 150)}...`);
  });

  process.exit(0);
}

// ============================================================
// Option 2 continued: Real MiniMax connection
// ============================================================

const team = new HanwudiTeam({
  verbose: true,
  triggerThreshold: 1.5,
  maxAutoActivate: 3,
  enableMemory: true,
});

// Connect MiniMax adapter
const adapter = team.connectMiniMax(apiKey);
console.log('✅ MiniMax adapter configured');
console.log(`   Model: ${adapter.isConfigured() ? 'ready' : 'NOT CONFIGURED'}\n`);

// ============================================================
// Example 1: Auto-activation
// ============================================================
console.log('=== Example 1: Auto-Activation ===');
console.log('Input: "I need to plan a microservices architecture and write code for user service"\n');

const activated = team.autoActivate(
  'I need to plan a microservices architecture and write code for user service'
);
console.log('Auto-activated:', activated.map(p => `${p.nameZh}(${p.name})`).join(', '));
console.log('');

const results = await team.process(
  'I need to plan a microservices architecture and write code for user service'
);

results.forEach(r => {
  console.log(`\n📌 [${r.persona}] ${r.output.slice(0, 200)}...`);
});

// ============================================================
// Example 2: Layer activation
// ============================================================
console.log('\n\n=== Example 2: Layer Activation (Full Team) ===');
team.deactivateAll();
team.activateLayer('zhongchao');  // Decision layer
team.activateLayer('waichao');   // Execution layer

console.log('Active personas:', team.getActivePersonas());

const workflowResults = await team.runWorkflow(
  'Create a blog API with authentication',
  undefined,   // use default SOP order
  { parallel: false }
);

workflowResults.forEach(step => {
  const out = step.output?.output || '';
  console.log(`\n[${step.persona}]: ${out.slice(0, 150)}...`);
});

// ============================================================
// Example 3: Custom workflow
// ============================================================
console.log('\n\n=== Example 3: Custom Workflow ===');
team.deactivateAll();
team.activatePersona('scholar');
team.activatePersona('general');
team.activatePersona('physician');

const customResults = await team.runWorkflow(
  'Fix the login bug where sessions expire too quickly',
  ['scholar', 'general', 'physician']
);

customResults.forEach(step => {
  console.log(`\n[${step.persona}]: ${step.output?.output?.slice(0, 150)}...`);
});

// ============================================================
// Memory inspection
// ============================================================
console.log('\n\n=== Memory Layer ===');
console.log(`Memory entries: ${team.getMemory().all.length}`);
console.log('Recent:', team.getMemory().getRecent(3).map(e => `[${e.persona}] ${e.content.slice(0, 50)}...`));

console.log('\n✅ All examples complete');
