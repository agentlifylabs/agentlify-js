/**
 * OpenAI to Agentlify Migration Guide
 * Side-by-side comparison showing how to migrate from OpenAI to Agentlify
 */

// ===== BEFORE: OpenAI =====
/*
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Basic chat completion
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  max_tokens: 100,
  temperature: 0.7
});

// Streaming
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}

// Function calling
const functionCompletion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What\'s the weather?' }],
  functions: [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }
  ]
});
*/

// ===== AFTER: Agentlify =====
const Agentlify=require('modelpilot');

const client=new Agentlify({
  apiKey: process.env.AGENTLIFY_API_KEY, // Only change needed!
  routerId: 'my-smart-router' // Optional: specify router for intelligent routing
});

async function migrationExamples() {
  console.log('🔄 OpenAI → Agentlify Migration Examples\n');

  // 1. Basic chat completion (IDENTICAL API)
  console.log('1. Basic Chat Completion (same API):');
  const completion=await client.chat.create({
    // model: 'gpt-4', // Optional with Agentlify - intelligent routing!
    messages: [
      {role: 'system',content: 'You are a helpful assistant.'},
      {role: 'user',content: 'Hello!'}
    ],
    max_tokens: 100,
    temperature: 0.7
  });

  console.log('Response:',completion.choices[0].message.content);
  console.log('✨ Agentlify automatically selected:',completion._meta?.modelUsed);
  console.log();

  // 2. Streaming (IDENTICAL API)
  console.log('2. Streaming (same API):');
  const stream=await client.chat.create({
    messages: [{role: 'user',content: 'Write a haiku about code.'}],
    stream: true,
  });

  process.stdout.write('Streaming: ');
  for await(const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content||'');
  }
  console.log('\n');

  // 3. Function calling (IDENTICAL API)
  console.log('3. Function Calling (same API):');
  const functionCompletion=await client.chat.create({
    messages: [{role: 'user',content: 'What\'s the weather in Tokyo?'}],
    functions: [
      {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {type: 'string',description: 'City name'}
          },
          required: ['location']
        }
      }
    ],
    function_call: 'auto'
  });

  if(functionCompletion.choices[0].message.function_call) {
    console.log('Function called:',functionCompletion.choices[0].message.function_call.name);
    console.log('Arguments:',functionCompletion.choices[0].message.function_call.arguments);
  }
  console.log();

  // 4. Agentlify-specific features
  console.log('4. Agentlify-Specific Features:');

  // Force a specific model (like OpenAI)
  const specificModel=await client.chat.create({
    model: 'openai:gpt-4o', // Force specific model
    messages: [{role: 'user',content: 'Hello from GPT-4!'}]
  });
  console.log('Forced model response:',specificModel.choices[0].message.content);

  // Let Agentlify choose the best model
  const smartRouted=await client.chat.create({
    // No model specified - Agentlify chooses best model for the task
    messages: [{role: 'user',content: 'Analyze this complex data and provide insights.'}]
  });
  console.log('Smart-routed model:',smartRouted._meta?.modelUsed);
  console.log('Selection confidence:',smartRouted._meta?.confidence);
  console.log('Cost optimization:',smartRouted._meta?.cost);
  console.log();

  console.log('✅ Migration complete! Your OpenAI code works with minimal changes.');
  console.log('🚀 Plus you get intelligent model routing, cost optimization, and more!');
}

// Key Migration Steps:
console.log(`
📋 MIGRATION CHECKLIST:

1. Install Agentlify:
   npm install modelpilot

2. Replace import:
   - const OpenAI = require('openai');
   + const Agentlify = require('modelpilot');

3. Update client initialization:
   - const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   + const client = new Agentlify({ apiKey: process.env.AGENTLIFY_API_KEY });

4. Update method calls:
   - openai.chat.completions.create(...)
   + client.chat.create(...)

5. Optional: Remove model specification to enable intelligent routing
   - model: 'gpt-4'  // Remove this line
   + // Agentlify will choose the best model automatically

6. Optional: Add router configuration
   + routerId: 'my-router'  // Enable custom routing logic

✨ That's it! Your code now has intelligent model routing with the same API.
`);

if(require.main===module) {
  migrationExamples().catch(console.error);
}

module.exports=migrationExamples;
