/**
 * Agentlify Chat Completions API
 * OpenAI-compatible chat completions with intelligent model routing
 */

const {validateMessages,validateFunctions,validateTools,extractStreamingText}=require('./utils');
const {InvalidRequestError}=require('./errors');

/**
 * Chat Completions API class
 */
class ChatCompletions {
  constructor(client) {
    this.client=client;
  }

  /**
   * Create a chat completion
   * @param {Object} params - Chat completion parameters
   * @param {Array} params.messages - Array of message objects
   * @param {string} [params.model] - Model to use (optional with Agentlify routing)
   * @param {number} [params.max_tokens] - Maximum tokens to generate
   * @param {number} [params.temperature] - Sampling temperature
   * @param {number} [params.top_p] - Nucleus sampling parameter
   * @param {number} [params.frequency_penalty] - Frequency penalty
   * @param {number} [params.presence_penalty] - Presence penalty
   * @param {Array} [params.stop] - Stop sequences
   * @param {boolean} [params.stream] - Enable streaming
   * @param {Array} [params.functions] - Function definitions (deprecated, use tools)
   * @param {string} [params.function_call] - Function call behavior
   * @param {Array} [params.tools] - Tool definitions
   * @param {Object} [params.tool_choice] - Tool choice behavior
   * @param {Object} [params.response_format] - Response format specification
   * @param {string} [params.user] - User identifier
   * @returns {Promise<Object>} Chat completion response
   */
  async create(params) {
    // Validate required parameters
    if(!params.messages) {
      throw new InvalidRequestError('messages is required','messages');
    }

    validateMessages(params.messages);

    // Validate optional parameters
    if(params.functions) {
      validateFunctions(params.functions);
    }

    if(params.tools) {
      validateTools(params.tools);
    }

    if(params.max_tokens&&(typeof params.max_tokens!=='number'||params.max_tokens<=0)) {
      throw new InvalidRequestError('max_tokens must be a positive number','max_tokens');
    }

    if(params.temperature&&(typeof params.temperature!=='number'||params.temperature<0||params.temperature>2)) {
      throw new InvalidRequestError('temperature must be between 0 and 2','temperature');
    }

    if(params.top_p&&(typeof params.top_p!=='number'||params.top_p<=0||params.top_p>1)) {
      throw new InvalidRequestError('top_p must be between 0 and 1','top_p');
    }

    // Build request payload
    const requestPayload={
      messages: params.messages,
      routerId: this.client.routerId,
      ...this._buildOptionalParams(params)
    };

    // Handle streaming vs non-streaming
    if(params.stream) {
      return this._createStreamingCompletion(requestPayload);
    } else {
      return this._createCompletion(requestPayload);
    }
  }

  /**
   * Build optional parameters for the request
   * @private
   */
  _buildOptionalParams(params) {
    const optional={};

    // Model selection (optional with Agentlify)
    if(params.model) {
      optional.model=params.model;
    }

    // Sampling parameters
    if(params.max_tokens!==undefined) optional.max_tokens=params.max_tokens;
    if(params.temperature!==undefined) optional.temperature=params.temperature;
    if(params.top_p!==undefined) optional.top_p=params.top_p;
    if(params.frequency_penalty!==undefined) optional.frequency_penalty=params.frequency_penalty;
    if(params.presence_penalty!==undefined) optional.presence_penalty=params.presence_penalty;
    if(params.stop!==undefined) optional.stop=params.stop;

    // Function calling (legacy)
    if(params.functions!==undefined) optional.functions=params.functions;
    if(params.function_call!==undefined) optional.function_call=params.function_call;

    // Tool calling (modern)
    if(params.tools!==undefined) optional.tools=params.tools;
    if(params.tool_choice!==undefined) optional.tool_choice=params.tool_choice;

    // Response format
    if(params.response_format!==undefined) optional.response_format=params.response_format;

    // User identifier
    if(params.user!==undefined) optional.user=params.user;

    // Streaming
    if(params.stream!==undefined) optional.stream=params.stream;

    return optional;
  }

  /**
   * Create a standard (non-streaming) completion
   * @private
   */
  async _createCompletion(payload) {
    // Agentlify router expects routerId in the URL path
    const endpoint=`/router/${this.client.routerId}`;

    const response=await this.client.request(endpoint,{
      method: 'POST',
      data: payload
    });

    return response;
  }

  /**
   * Create a streaming completion
   * @private
   */
  async _createStreamingCompletion(payload) {
    // Agentlify router expects routerId in the URL path
    const endpoint=`/router/${this.client.routerId}`;

    const response=await this.client.httpClient({
      url: endpoint,
      method: 'POST',
      data: payload,
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    return new ChatCompletionStream(response.data);
  }
}

/**
 * Chat Completion Stream class for handling streaming responses
 */
class ChatCompletionStream {
  constructor(stream) {
    this.stream=stream;
    this._buffer='';
  }

  /**
   * Async iterator for streaming chunks
   */
  async *[Symbol.asyncIterator]() {
    for await(const chunk of this.stream) {
      this._buffer+=chunk.toString();

      // Process complete lines
      const lines=this._buffer.split('\n');
      this._buffer=lines.pop()||''; // Keep incomplete line in buffer

      for(const line of lines) {
        if(line.trim()) {
          const text=extractStreamingText(line);
          if(text!==null) {
            yield {
              choices: [{
                delta: {content: text},
                index: 0,
                finish_reason: null
              }],
              created: Math.floor(Date.now()/1000),
              model: 'modelpilot-routed',
              object: 'chat.completion.chunk'
            };
          }
        }
      }
    }

    // Process any remaining buffer content
    if(this._buffer.trim()) {
      const text=extractStreamingText(this._buffer);
      if(text!==null) {
        yield {
          choices: [{
            delta: {content: text},
            index: 0,
            finish_reason: null
          }],
          created: Math.floor(Date.now()/1000),
          model: 'modelpilot-routed',
          object: 'chat.completion.chunk'
        };
      }
    }

    // Send final chunk with finish_reason
    yield {
      choices: [{
        delta: {},
        index: 0,
        finish_reason: 'stop'
      }],
      created: Math.floor(Date.now()/1000),
      model: 'modelpilot-routed',
      object: 'chat.completion.chunk'
    };
  }

  /**
   * Convert stream to array of chunks
   */
  async toArray() {
    const chunks=[];
    for await(const chunk of this) {
      chunks.push(chunk);
    }
    return chunks;
  }

  /**
   * Get the final completion text
   */
  async getText() {
    let text='';
    for await(const chunk of this) {
      if(chunk.choices[0].delta.content) {
        text+=chunk.choices[0].delta.content;
      }
    }
    return text;
  }
}

module.exports={
  ChatCompletions,
  ChatCompletionStream
};
