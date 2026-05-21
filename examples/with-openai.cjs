/**
 * Hanwudi Team - Example with OpenAI LLM
 * (Renamed from .js to .cjs — this file uses CommonJS require, package is ESM)
 *
 * Prerequisites:
 *   npm install openai
 *   export OPENAI_API_KEY=your-key
 *
 * Run with: node examples/with-openai.cjs
 */

const { HanwudiTeam } = require('../dist/index.cjs');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key'
});

const llmAdapter = {
  async chat(messages) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7
    });
    return response.choices[0].message.content;
  }
};

const team = new HanwudiTeam({
  llm: llmAdapter,
  verbose: true
});

async function demo() {
  console.log('=== Hanwudi Team with OpenAI ===\n');
  team.activate('code, review, document');
  const results = await team.process('Create a REST API for user management with authentication');
  results.forEach(r => {
    console.log(`\n=== ${r.persona} ===`);
    console.log(r.output);
  });
  console.log('\n--- Conversation History ---');
  team.getHistory().forEach(msg => {
    console.log(`[${msg.role}] ${msg.content.substring(0, 80)}...`);
  });
}

demo().catch(console.error);
