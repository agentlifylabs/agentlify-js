/**
 * Agentlify Utility Functions
 * Helper functions for the Agentlify client
 */

const {InvalidRequestError}=require('./errors');

/**
 * Validate client configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validated configuration
 */
function validateConfig(config) {
  if(!config.apiKey) {
    throw new Error('Agentlify API key is required. Get one at https://modelpilot.co');
  }

  if(typeof config.apiKey!=='string') {
    throw new Error('API key must be a string');
  }

  if(config.baseURL&&typeof config.baseURL!=='string') {
    throw new Error('baseURL must be a string');
  }

  if(config.timeout&&(typeof config.timeout!=='number'||config.timeout<=0)) {
    throw new Error('timeout must be a positive number');
  }

  if(config.maxRetries&&(typeof config.maxRetries!=='number'||config.maxRetries<0)) {
    throw new Error('maxRetries must be a non-negative number');
  }

  return config;
}

/**
 * Build headers for API requests
 * @param {string} apiKey - API key (should start with 'mp_')
 * @param {Object} additionalHeaders - Additional headers
 * @returns {Object} Headers object
 */
function buildHeaders(apiKey,additionalHeaders={}) {
  // Ensure API key has proper format for Agentlify
  if(!apiKey.startsWith('mp_')) {
    throw new Error('Invalid Agentlify API key format. API key must start with "mp_"');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': 'modelpilot-js/1.0.0',
    'X-Client-Library': 'modelpilot-js',
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}

/**
 * Handle API response
 * @param {Object} response - Axios response object
 * @returns {Object} Response object
 */
function handleResponse(response) {
  // Return the response as-is for successful requests
  return response;
}

/**
 * Validate messages array for chat completions
 * @param {Array} messages - Messages array
 */
function validateMessages(messages) {
  if(!Array.isArray(messages)) {
    throw new Error('messages must be an array');
  }

  if(messages.length===0) {
    throw new InvalidRequestError('messages array cannot be empty','messages');
  }

  for(const [index,message] of messages.entries()) {
    if(!message||typeof message!=='object') {
      throw new Error(`messages[${index}] must be an object`);
    }

    if(!message.role) {
      throw new Error(`messages[${index}].role is required`);
    }

    if(!['system','user','assistant','function','tool'].includes(message.role)) {
      throw new Error(`messages[${index}].role must be one of: system, user, assistant, function, tool`);
    }

    if(!message.content&&!message.function_call&&!message.tool_calls) {
      throw new Error(`messages[${index}].content is required when role is not function or tool`);
    }
  }
}

/**
 * Validate function definitions
 * @param {Array} functions - Functions array
 */
function validateFunctions(functions) {
  if(!Array.isArray(functions)) {
    throw new Error('functions must be an array');
  }

  for(const [index,func] of functions.entries()) {
    if(!func||typeof func!=='object') {
      throw new Error(`functions[${index}] must be an object`);
    }

    if(!func.name||typeof func.name!=='string') {
      throw new Error(`functions[${index}].name is required and must be a string`);
    }

    if(func.description&&typeof func.description!=='string') {
      throw new Error(`functions[${index}].description must be a string`);
    }

    if(func.parameters&&typeof func.parameters!=='object') {
      throw new Error(`functions[${index}].parameters must be an object`);
    }
  }
}

/**
 * Validate tools array
 * @param {Array} tools - Tools array
 */
function validateTools(tools) {
  if(!Array.isArray(tools)) {
    throw new Error('tools must be an array');
  }

  for(const [index,tool] of tools.entries()) {
    if(!tool||typeof tool!=='object') {
      throw new Error(`tools[${index}] must be an object`);
    }

    if(!tool.type) {
      throw new Error(`tools[${index}].type is required`);
    }

    if(tool.type==='function') {
      if(!tool.function) {
        throw new Error(`tools[${index}].function is required when type is 'function'`);
      }

      validateFunctions([tool.function]);
    }
  }
}

/**
 * Convert streaming data to text
 * @param {string} chunk - Raw chunk data
 * @returns {string|null} Extracted text or null
 */
function extractStreamingText(chunk) {
  try {
    // Remove 'data: ' prefix if present
    const cleanChunk=chunk.replace(/^data: /,'');

    // Skip empty lines and [DONE] marker
    if(!cleanChunk.trim()||cleanChunk.trim()==='[DONE]') {
      return null;
    }

    const parsed=JSON.parse(cleanChunk);

    // Extract content from different possible structures
    if(parsed.choices&&parsed.choices[0]) {
      const choice=parsed.choices[0];

      // Handle delta format (streaming)
      if(choice.delta&&choice.delta.content) {
        return choice.delta.content;
      }

      // Handle message format (non-streaming)
      if(choice.message&&choice.message.content) {
        return choice.message.content;
      }
    }

    return null;
  } catch(error) {
    // Ignore parsing errors for malformed chunks
    return null;
  }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve,ms));
}

/**
 * Generate a unique request ID
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
}

module.exports={
  validateConfig,
  buildHeaders,
  handleResponse,
  validateMessages,
  validateFunctions,
  validateTools,
  extractStreamingText,
  sleep,
  generateRequestId
};
