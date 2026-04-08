/**
 * Hanwudi Team - Example with OpenAI LLM
 * 
 * Prerequisites:
 *   npm install openai
 *   export OPENAI_API_KEY=your_api_key
 */

const { HanwudiTeam } = require('./dist');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key'
});

// Create LLM adapter
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

// Create team with LLM
const team = new HanwudiTeam({ 
  llm: llmAdapter,
  verbose: true 
});

async function demo() {
  console.log('=== Hanwudi Team with OpenAI ===\n');

  // Activate relevant personas
  team.activate('code, review, document');

  // Process request
  console.log('\nProcessing: "Create a REST API for user management"\n');
  const results = await team.process('Create a REST API for user management with authentication');

  // Display results
  results.forEach(r => {
    console.log(`\n=== ${r.persona} ===`);
    console.log(r.output);
  });

  // Show conversation history
  console.log('\n--- Conversation History ---');
  team.getHistory().forEach(msg => {
    console.log(`[${msg.role}] ${msg.content.substring(0, 80)}...`);
  });
}

demo().catch(console.error);
