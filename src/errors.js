/**
 * Agentlify Error Classes
 * OpenAI-compatible error handling
 */

/**
 * Base Agentlify error class
 */
class AgentlifyError extends Error {
  constructor(message,options={}) {
    super(message);
    this.name='AgentlifyError';
    this.type=options.type||'modelpilot_error';
    this.code=options.code;
    this.param=options.param;
  }
}

/**
 * API error - for HTTP errors from the Agentlify API
 */
class APIError extends AgentlifyError {
  constructor(message,status,response=null) {
    super(message,{type: 'api_error'});
    this.name='APIError';
    this.status=status;
    this.response=response;
    this.code=response?.error?.code;
    this.param=response?.error?.param;
  }
}

/**
 * Authentication error - for invalid API keys
 */
class AuthenticationError extends APIError {
  constructor(message) {
    super(message,401);
    this.name='AuthenticationError';
    this.type='authentication_error';
  }
}

/**
 * Rate limit error - for rate limiting
 */
class RateLimitError extends APIError {
  constructor(message) {
    super(message,429);
    this.name='RateLimitError';
    this.type='rate_limit_exceeded';
  }
}

/**
 * Invalid request error - for malformed requests
 */
class InvalidRequestError extends APIError {
  constructor(message,param=null) {
    super(message,400);
    this.name='InvalidRequestError';
    this.type='invalid_request_error';
    this.param=param;
  }
}

/**
 * Permission denied error - for insufficient permissions
 */
class PermissionDeniedError extends APIError {
  constructor(message) {
    super(message,403);
    this.name='PermissionDeniedError';
    this.type='permission_denied';
  }
}

/**
 * Not found error - for missing resources
 */
class NotFoundError extends APIError {
  constructor(message) {
    super(message,404);
    this.name='NotFoundError';
    this.type='not_found_error';
  }
}

/**
 * Conflict error - for resource conflicts
 */
class ConflictError extends APIError {
  constructor(message) {
    super(message,409);
    this.name='ConflictError';
    this.type='conflict_error';
  }
}

/**
 * Unprocessable entity error - for validation errors
 */
class UnprocessableEntityError extends APIError {
  constructor(message) {
    super(message,422);
    this.name='UnprocessableEntityError';
    this.type='unprocessable_entity';
  }
}

/**
 * Internal server error - for server-side errors
 */
class InternalServerError extends APIError {
  constructor(message) {
    super(message,500);
    this.name='InternalServerError';
    this.type='internal_server_error';
  }
}

module.exports={
  AgentlifyError,
  APIError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  PermissionDeniedError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError
};
