/**
 * Test utilities for Agentlify npm package tests
 */

/**
 * Create a mock axios response
 */
function createMockResponse(data,status=200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  };
}

/**
 * Create a mock axios error
 */
function createMockError(message,status=500,data=null) {
  const error=new Error(message);
  error.response={
    status,
    statusText: status===401? 'Unauthorized':'Internal Server Error',
    data: data||{error: {message}},
    headers: {},
    config: {}
  };
  return error;
}

/**
 * Create a mock streaming response
 */
function createMockStreamResponse(chunks) {
  return {
    data: {
      [Symbol.asyncIterator]: async function*() {
        for(const chunk of chunks) {
          yield Buffer.from(chunk);
        }
      }
    }
  };
}

module.exports={
  createMockResponse,
  createMockError,
  createMockStreamResponse
};
