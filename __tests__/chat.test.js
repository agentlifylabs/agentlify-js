/**
 * Tests for ChatCompletions class
 */

const axios=require('axios');
const MockAdapter=require('axios-mock-adapter');
const Agentlify=require('../src/index');
const {ChatCompletionStream}=require('../src/chat');
const {InvalidRequestError}=require('../src/errors');

// Create axios mock adapter
const mock=new MockAdapter(axios);

describe('ChatCompletions',() => {
  let client;
  let chat;

  beforeEach(() => {
    // Reset all mocks
    mock.reset();

    client=new Agentlify({
      apiKey: 'mp_test-api-key',
      routerId: 'test-router-id'
    });
    chat=client.chat;
  });

  afterEach(() => {
    mock.reset();
  });

  describe('create',() => {
    const validMessages=[
      {role: 'user',content: 'Hello!'}
    ];

    it('should create basic chat completion',async () => {
      const mockResponse={
        id: 'chatcmpl-123',
        object: 'chat.completion',
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
          }
        }]
      };

      mock.onPost().reply(200,mockResponse);

      const completion=await chat.create({
        messages: validMessages,
        max_tokens: 100
      });

      expect(completion).toEqual(mockResponse);
      expect(mock.history.post).toHaveLength(1);
      expect(mock.history.post[0].url).toMatch(/\/router\//);
    });

    it('should validate required messages parameter',async () => {
      await expect(chat.create({})).rejects.toThrow(InvalidRequestError);
      await expect(chat.create({messages: null})).rejects.toThrow(InvalidRequestError);
      await expect(chat.create({messages: []})).rejects.toThrow(InvalidRequestError);
    });

    it('should validate message format',async () => {
      await expect(chat.create({
        messages: [{content: 'Missing role'}]
      })).rejects.toThrow('role is required');

      await expect(chat.create({
        messages: [{role: 'user'}]
      })).rejects.toThrow('content is required');
    });

    it('should validate max_tokens parameter',async () => {
      await expect(chat.create({
        messages: validMessages,
        max_tokens: -1
      })).rejects.toThrow('max_tokens must be a positive number');
    });

    it('should validate temperature parameter',async () => {
      await expect(chat.create({
        messages: validMessages,
        temperature: 2.5
      })).rejects.toThrow('temperature must be between 0 and 2');
    });

    it('should handle function calling',async () => {
      const functions=[{
        name: 'get_weather',
        description: 'Get weather',
        parameters: {
          type: 'object',
          properties: {
            location: {type: 'string'}
          }
        }
      }];

      const mockResponse={
        id: 'chatcmpl-123',
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            function_call: {
              name: 'get_weather',
              arguments: '{"location": "San Francisco"}'
            }
          }
        }]
      };

      mock.onPost().reply(200,mockResponse);

      const completion=await chat.create({
        messages: validMessages,
        functions,
        function_call: 'auto'
      });

      expect(completion.choices[0].message.function_call).toBeDefined();
      expect(mock.history.post).toHaveLength(1);
    });

    it('should handle tools (modern function calling)',async () => {
      const tools=[{
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get weather',
          parameters: {
            type: 'object',
            properties: {
              location: {type: 'string'}
            }
          }
        }
      }];

      const mockResponse={
        id: 'chatcmpl-123',
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_123',
              type: 'function',
              function: {
                name: 'get_weather',
                arguments: '{"location": "San Francisco"}'
              }
            }]
          }
        }]
      };

      mock.onPost().reply(200,mockResponse);

      const completion=await chat.create({
        messages: validMessages,
        tools,
        tool_choice: 'auto'
      });

      expect(completion.choices[0].message.tool_calls).toBeDefined();
      expect(mock.history.post).toHaveLength(1);
    });

    it('should validate functions parameter',async () => {
      await expect(chat.create({
        messages: validMessages,
        functions: 'invalid'
      })).rejects.toThrow('functions must be an array');

      await expect(chat.create({
        messages: validMessages,
        functions: [{description: 'Missing name'}]
      })).rejects.toThrow('name is required');
    });

    it('should validate tools parameter',async () => {
      await expect(chat.create({
        messages: validMessages,
        tools: 'invalid'
      })).rejects.toThrow('tools must be an array');

      await expect(chat.create({
        messages: validMessages,
        tools: [{function: {name: 'test'}}]
      })).rejects.toThrow('type is required');
    });
  });

  describe('streaming',() => {
    it('should handle streaming completions',async () => {
      const mockStreamData='data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      // Mock streaming response
      mock.onPost().reply(200,mockStreamData,{
        'content-type': 'text/event-stream'
      });

      const stream=await chat.create({
        messages: [{role: 'user',content: 'Hello!'}],
        stream: true
      });

      expect(stream).toBeInstanceOf(ChatCompletionStream);
      expect(mock.history.post).toHaveLength(1);
    });
  });
});
