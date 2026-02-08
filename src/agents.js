/**
 * Agentlify Agents API
 * Execute agents with local tool callbacks - tools execute in your code, not on the server
 */

const {InvalidRequestError}=require('./errors');

/**
 * Agents API class
 */
class Agents {
  constructor(client) {
    this.client=client;
  }

  /**
   * Execute an agent with optional local tool handlers
   * 
   * When you provide tools with callbacks, the agent will:
   * 1. Send your tools to the agent
   * 2. If the agent calls a tool, return the tool call to you
   * 3. Your callback executes locally
   * 4. The SDK automatically resumes the agent with the tool result
   * 5. This continues until the agent completes
   * 
   * @param {Object} params - Agent execution parameters
   * @param {string} params.agentId - Agent ID to execute
   * @param {Array} params.messages - Array of message objects
   * @param {Array} [params.tools] - Tool definitions with optional callbacks
   * @param {Object} [params.options] - Additional options
   * @param {number} [params.maxToolIterations=10] - Max tool call iterations
   * @returns {Promise<Object>} Agent execution response
   * 
   * @example
   * // Tools with callbacks - executed locally
   * const response = await client.agents.run({
   *   agentId: 'my-agent',
   *   messages: [{ role: 'user', content: 'What is the weather in NYC?' }],
   *   tools: [{
   *     type: 'function',
   *     function: {
   *       name: 'get_weather',
   *       description: 'Get current weather for a location',
   *       parameters: {
   *         type: 'object',
   *         properties: {
   *           location: { type: 'string', description: 'City name' }
   *         },
   *         required: ['location']
   *       }
   *     },
   *     // Callback executes in YOUR code
   *     callback: async (args) => {
   *       const weather = await fetchWeatherAPI(args.location);
   *       return { temperature: weather.temp, conditions: weather.conditions };
   *     }
   *   }]
   * });
   */
  async run(params) {
    if(!params.agentId) {
      throw new InvalidRequestError('agentId is required','agentId');
    }

    if(!params.messages||!Array.isArray(params.messages)) {
      throw new InvalidRequestError('messages array is required','messages');
    }

    // Extract callbacks from tools and create clean tools for API
    const {tools,toolCallbacks}=this._extractToolCallbacks(params.tools||[]);

    // Build initial request
    const requestPayload={
      agentId: params.agentId,
      messages: params.messages,
      ...(tools.length>0? {tools}:{}),
      options: params.options||{}
    };

    const maxIterations=params.maxToolIterations||10;
    let iteration=0;
    const currentMessages=[...params.messages];
    let response;

    // Tool execution loop
    while(iteration<maxIterations) {
      iteration++;

      response=await this._executeAgent(requestPayload);

      // Check if agent needs tool execution
      const needsToolExecution=response.choices?.[0]?.finish_reason==='tool_calls'||
        response.agent_metadata?.requires_tool_execution;

      if(!needsToolExecution) {
        // Agent completed - return final response
        return response;
      }

      // Get pending tool calls
      const toolCalls=response.choices?.[0]?.message?.tool_calls;
      if(!toolCalls||toolCalls.length===0) {
        // No tool calls but marked as needing execution - return as-is
        return response;
      }

      // Execute tool callbacks locally
      const toolResults=await this._executeToolCallbacks(toolCalls,toolCallbacks);

      // Add assistant message with tool calls and tool results to messages
      currentMessages.push({
        role: 'assistant',
        content: response.choices[0].message.content||null,
        tool_calls: toolCalls
      });

      for(const result of toolResults) {
        currentMessages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: typeof result.content==='string'? result.content:JSON.stringify(result.content)
        });
      }

      // Update request for next iteration
      requestPayload.messages=currentMessages;
    }

    // Max iterations reached
    throw new Error(`Agent tool execution exceeded maximum iterations (${maxIterations})`);
  }

  /**
   * Execute agent without tool callback handling (single request)
   * Use this when you want to handle tool calls manually
   * 
   * @param {Object} params - Agent execution parameters
   * @returns {Promise<Object>} Agent execution response
   */
  async execute(params) {
    if(!params.agentId) {
      throw new InvalidRequestError('agentId is required','agentId');
    }

    if(!params.messages||!Array.isArray(params.messages)) {
      throw new InvalidRequestError('messages array is required','messages');
    }

    // Strip callbacks from tools if present
    const tools=(params.tools||[]).map(t => {
      const toolDef={...t};
      delete toolDef.callback;
      return toolDef;
    });

    const requestPayload={
      agentId: params.agentId,
      messages: params.messages,
      ...(tools.length>0? {tools}:{}),
      options: params.options||{}
    };

    return this._executeAgent(requestPayload);
  }

  /**
   * Extract callbacks from tool definitions
   * @private
   */
  _extractToolCallbacks(tools) {
    const cleanTools=[];
    const toolCallbacks=new Map();

    for(const tool of tools) {
      // Extract callback if present
      const {callback,...toolDef}=tool;

      if(callback&&typeof callback==='function') {
        const toolName=tool.function?.name;
        if(toolName) {
          toolCallbacks.set(toolName,callback);
        }
      }

      cleanTools.push(toolDef);
    }

    return {tools: cleanTools,toolCallbacks};
  }

  /**
   * Execute tool callbacks locally
   * @private
   */
  async _executeToolCallbacks(toolCalls,toolCallbacks) {
    const results=[];

    for(const toolCall of toolCalls) {
      const toolName=toolCall.function?.name;
      const callback=toolCallbacks.get(toolName);

      let result;
      if(callback) {
        try {
          // Parse arguments
          let args={};
          if(toolCall.function?.arguments) {
            args=typeof toolCall.function.arguments==='string'
              ? JSON.parse(toolCall.function.arguments)
              :toolCall.function.arguments;
          }

          // Execute callback
          result=await callback(args);
        } catch(error) {
          result={error: error.message};
        }
      } else {
        // No callback registered - return error
        result={error: `No callback registered for tool: ${toolName}`};
      }

      results.push({
        tool_call_id: toolCall.id,
        content: result
      });
    }

    return results;
  }

  /**
   * Make agent API request
   * @private
   */
  async _executeAgent(payload) {
    const endpoint='/agents';
    return this.client.request(endpoint,{
      method: 'POST',
      data: payload
    });
  }
}

module.exports={Agents};
