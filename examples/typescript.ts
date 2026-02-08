/**
 * TypeScript Usage Example for Agentlify
 * Demonstrates type-safe usage with full IntelliSense support
 */

import Agentlify, {
  ChatCompletionCreateParams,
  ChatCompletionResponse,
  ChatCompletionStream,
  AgentlifyConfig,
  Model,
  RouterConfig,
  AuthenticationError,
  RateLimitError,
  APIError,
} from 'modelpilot';

async function typescriptExample(): Promise<void> {
  console.log('🔷 Agentlify TypeScript Example\n');

  // Type-safe client configuration
  const config: AgentlifyConfig = {
    apiKey: process.env.AGENTLIFY_API_KEY!,
    routerId: 'my-typescript-router',
    timeout: 30000,
    maxRetries: 3,
  };

  const client = new Agentlify(config);

  try {
    // 1. Type-safe chat completion
    console.log('1. Type-safe Chat Completion:');

    const params: ChatCompletionCreateParams = {
      messages: [
        { role: 'system', content: 'You are a TypeScript expert.' },
        {
          role: 'user',
          content: 'Explain the benefits of TypeScript over JavaScript.',
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    };

    const completion: ChatCompletionResponse = await client.chat.create(params);

    console.log('Response:', completion.choices[0].message.content);
    console.log('Model used:', completion._meta?.modelUsed);
    console.log('Type safety: ✅ Full IntelliSense support\n');

    // 2. Streaming with types
    console.log('2. Type-safe Streaming:');

    const streamParams: ChatCompletionCreateParams = {
      messages: [
        { role: 'user', content: 'Write a short TypeScript function example.' },
      ],
      stream: true,
      max_tokens: 150,
    };

    const stream: ChatCompletionStream = await client.chat.create(streamParams);

    process.stdout.write('Streaming response: ');
    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
    console.log('\n');

    // 3. Function calling with types
    console.log('3. Type-safe Function Calling:');

    const functionParams: ChatCompletionCreateParams = {
      messages: [{ role: 'user', content: 'Calculate the factorial of 5' }],
      functions: [
        {
          name: 'calculate_factorial',
          description: 'Calculate factorial of a number',
          parameters: {
            type: 'object',
            properties: {
              number: {
                type: 'integer',
                description: 'Number to calculate factorial for',
              },
            },
            required: ['number'],
          },
        },
      ],
      function_call: 'auto',
    };

    const functionCompletion: ChatCompletionResponse =
      await client.chat.create(functionParams);

    if (functionCompletion.choices[0].message.function_call) {
      const { name, arguments: args } =
        functionCompletion.choices[0].message.function_call;
      console.log(`Function called: ${name}`);
      console.log(`Arguments: ${args}`);

      // Type-safe argument parsing
      const parsedArgs = JSON.parse(args) as { number: number };
      console.log(
        `Parsed number: ${parsedArgs.number} (type: ${typeof parsedArgs.number})`,
      );
    }
    console.log();

    // 4. Router and model information with types
    console.log('4. Type-safe Metadata Retrieval:');

    const routerConfig: RouterConfig = await client.getRouterConfig();
    console.log('Router info:', {
      id: routerConfig.id,
      name: routerConfig.name,
      mode: routerConfig.mode,
      capabilities: routerConfig.capabilities,
    });

    const models: Model[] = await client.getModels();
    console.log('Available models:', models.length);

    // Type-safe model filtering
    const chatModels = models.filter((model) => model.capabilities.chat);
    const functionModels = models.filter(
      (model) => model.capabilities.functions,
    );
    const visionModels = models.filter((model) => model.capabilities.vision);

    console.log(`Chat models: ${chatModels.length}`);
    console.log(`Function calling models: ${functionModels.length}`);
    console.log(`Vision models: ${visionModels.length}`);
    console.log();

    // 5. Advanced type usage
    console.log('5. Advanced TypeScript Features:');

    // Generic function for different completion types
    async function createCompletion<T extends boolean>(
      params: ChatCompletionCreateParams & { stream: T },
    ): Promise<T extends true ? ChatCompletionStream : ChatCompletionResponse> {
      return client.chat.create(params) as any;
    }

    // Type-safe streaming
    const typedStream = await createCompletion({
      messages: [{ role: 'user', content: 'Hello!' }],
      stream: true,
    });
    console.log('Stream type:', typedStream.constructor.name);

    // Type-safe non-streaming
    const typedCompletion = await createCompletion({
      messages: [{ role: 'user', content: 'Hello!' }],
      stream: false,
    });
    console.log('Completion type:', typeof typedCompletion);
  } catch (error) {
    // Type-safe error handling
    if (error instanceof AuthenticationError) {
      console.error('Authentication failed:', error.message);
      console.error('Please check your API key');
    } else if (error instanceof RateLimitError) {
      console.error('Rate limit exceeded:', error.message);
      console.error('Please wait before making more requests');
    } else if (error instanceof APIError) {
      console.error('API error:', error.message);
      console.error('Status:', error.status);
      console.error('Response:', error.response);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Utility types for advanced usage
type ChatRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

interface TypedMessage<T extends ChatRole = ChatRole> {
  role: T;
  content: string;
  name?: T extends 'function' ? string : never;
}

// Example of creating type-safe message builders
function createSystemMessage(content: string): TypedMessage<'system'> {
  return { role: 'system', content };
}

function createUserMessage(content: string): TypedMessage<'user'> {
  return { role: 'user', content };
}

function createAssistantMessage(content: string): TypedMessage<'assistant'> {
  return { role: 'assistant', content };
}

// Type-safe conversation builder
class ConversationBuilder {
  private messages: ChatCompletionCreateParams['messages'] = [];

  system(content: string): this {
    this.messages.push(createSystemMessage(content));
    return this;
  }

  user(content: string): this {
    this.messages.push(createUserMessage(content));
    return this;
  }

  assistant(content: string): this {
    this.messages.push(createAssistantMessage(content));
    return this;
  }

  build(): ChatCompletionCreateParams['messages'] {
    return [...this.messages];
  }
}

// Example usage of conversation builder
async function conversationExample(): Promise<void> {
  const client = new Agentlify({
    apiKey: process.env.AGENTLIFY_API_KEY!,
  });

  const conversation = new ConversationBuilder()
    .system('You are a helpful TypeScript assistant.')
    .user('What are the benefits of using TypeScript?')
    .assistant(
      'TypeScript provides static typing, better IDE support, and catches errors at compile time.',
    )
    .user('Can you show me an example?')
    .build();

  const completion = await client.chat.create({
    messages: conversation,
    max_tokens: 200,
  });

  console.log('Conversation response:', completion.choices[0].message.content);
}

// Run examples if called directly
if (require.main === module) {
  Promise.all([typescriptExample(), conversationExample()]).catch(
    console.error,
  );
}

export {
  typescriptExample,
  conversationExample,
  ConversationBuilder,
  createSystemMessage,
  createUserMessage,
  createAssistantMessage,
};
