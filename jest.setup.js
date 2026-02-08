// Jest setup file
// Global test configuration and mocks

// Mock environment variables for tests
process.env.AGENTLIFY_API_KEY='test-api-key';
process.env.NODE_ENV='test';

// Global test timeout
jest.setTimeout(10000);

// Mock axios for tests
jest.mock('axios',() => {
  const mockAxios=jest.fn();
  mockAxios.create=jest.fn(() => ({
    interceptors: {
      request: {use: jest.fn()},
      response: {use: jest.fn()}
    },
    defaults: {headers: {}}
  }));
  return mockAxios;
});

// Global test utilities
global.testUtils={
  createMockResponse: (data,status=200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  }),

  createMockError: (message,status=500) => {
    const error=new Error(message);
    error.response={
      status,
      data: {message},
      statusText: status>=500? 'Internal Server Error':'Bad Request'
    };
    return error;
  }
};
