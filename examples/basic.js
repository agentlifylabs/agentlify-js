/**
 * Basic Agentlify Usage Example
 * Demonstrates OpenAI-compatible API for intelligent model routing
 */

const Agentlify=require('../src/index');

async function basicExample() {
  // Initialize Agentlify client (similar to OpenAI)
  const client=new Agentlify({
    apiKey: process.env.AGENTLIFY_API_KEY, // Get from https://modelpilot.co
    routerId: 'my-router-id' // Required
  });

  try {
    console.log('🚀 Agentlify Basic Example\n');

    // Simple chat completion (OpenAI-compatible)
    console.log('1. Simple Chat Completion:');
    const completion=await client.chat.create({
      messages: [
        {role: 'system',content: 'You are a helpful assistant.'},
        {role: 'user',content: 'What is the capital of France?'}
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    console.log('Response:',completion.choices[0].message.content);
    console.log('Model used:',completion._meta?.modelUsed);
    console.log('Cost:',completion._meta?.cost);
    console.log('Latency:',completion._meta?.latency+'ms');
    console.log();

    // Streaming example
    console.log('2. Streaming Chat Completion:');
    const stream=await client.chat.create({
      messages: [
        {role: 'user',content: 'Write a short poem about AI.'}
      ],
      stream: true,
      max_tokens: 150
    });

    process.stdout.write('Streaming response: ');
    for await(const chunk of stream) {
      if(chunk.choices[0].delta.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
    console.log('\n');

    // Function calling example
    console.log('3. Function Calling:');
    const functionCompletion=await client.chat.create({
      messages: [
        {role: 'user',content: 'What\'s the weather like in New York?'}
      ],
      functions: [
        {
          name: 'get_weather',
          description: 'Get current weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'City name'
              }
            },
            required: ['location']
          }
        }
      ],
      function_call: 'auto'
    });

    console.log('Function call:',functionCompletion.choices[0].message.function_call);
    console.log();

    // Get router info
    console.log('4. Router Information:');
    const routerConfig=await client.getRouterConfig();
    console.log('Router mode:',routerConfig.mode);
    console.log('Router name:',routerConfig.name);
    console.log();

    // Get available models
    console.log('5. Available Models:');
    const models=await client.getModels();
    console.log('Available models:',models.map(m => m.id).join(', '));

  } catch(error) {
    console.error('Error:',error.message);
    if(error.status) {
      console.error('Status:',error.status);
    }
  }
}

// Run example if called directly
if(require.main===module) {
  basicExample().catch(console.error);
}

module.exports=basicExample;
