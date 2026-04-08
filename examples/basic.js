/**
 * Hanwudi Team - Basic Usage Example
 */

import { HanwudiTeam } from '../dist/index.js';

console.log('=== Hanwudi Team Demo ===\n');

// Create team
const team = new HanwudiTeam({ verbose: true });

// List all personas
console.log('\n--- All Available Personas ---');
const personas = team.listPersonas();
personas.forEach(p => {
  console.log(`- ${p.nameZh} (${p.name}): ${p.role}`);
});

// Example 1: Activate by triggers
console.log('\n--- Example 1: Activate by Triggers ---');
const activated = team.activate('I need to plan strategy and write code');
console.log('Activated personas:', activated.map(p => p.name));

// Process without LLM (template responses)
console.log('\n--- Processing Request ---');
const results = await team.process('Build a user authentication system');
results.forEach(r => {
  console.log(`\n[${r.persona}]:`);
  console.log(r.output.substring(0, 200) + '...');
});

// Example 2: Run workflow
console.log('\n\n--- Example 2: Workflow ---');
team.deactivateAll();
const workflowResults = await team.runWorkflow('Create a blog API');
workflowResults.forEach(step => {
  console.log(`\n[${step.persona}]: ${step.output?.output?.substring(0, 100)}...`);
});

console.log('\n=== Demo Complete ===');
