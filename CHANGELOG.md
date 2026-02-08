# Changelog

All notable changes to the Agentlify JavaScript/TypeScript library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-08

### Added

- Initial release of Agentlify JavaScript/TypeScript library
- OpenAI-compatible API for intelligent model routing
- Chat completions with streaming support
- Function calling and tool calling support
- TypeScript type definitions
- Comprehensive error handling
- Request retry logic with exponential backoff
- Rich response metadata including cost and latency
- Support for custom routers and model selection
- Migration guide from OpenAI library
- Full test suite with Jest
- ESLint configuration for code quality
- Rollup build system for CommonJS and ES modules
- Comprehensive documentation and examples

### Features

- **Chat Completions**: Full OpenAI-compatible chat completions API
- **Streaming**: Server-sent events streaming support
- **Function Calling**: Legacy functions and modern tools support
- **Model Routing**: Intelligent model selection and fallback
- **Cost Optimization**: Automatic routing to cost-effective models
- **Performance Metrics**: Detailed latency, cost, and usage tracking
- **Error Handling**: Comprehensive error classes and retry logic
- **TypeScript**: Full type definitions and IntelliSense support

### Supported Models

- OpenAI: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, o1-mini
- Anthropic: Claude 3.5 Sonnet, Claude 3 Haiku
- Automatic model selection based on task complexity and requirements

### Migration

- Drop-in replacement for OpenAI library with minimal code changes
- Maintains API compatibility while adding intelligent routing
- Comprehensive migration guide and examples provided
