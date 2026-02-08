# Agentlify JavaScript/TypeScript Client

**The Serverless Infrastructure for AI Agents.**

Build, run, and scale production AI agents with a single SDK. Agentlify handles the infrastructure—routing, observability, rate limits, and tool execution—so you can focus on building features.

[![npm version](https://badge.fury.io/js/agentlify-js.svg)](https://www.npmjs.com/package/agentlify-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Agentlify?

Think of us as **"Netlify for LLMs"**:

- **DevX First**: Install one SDK, access any model (OpenAI, Anthropic, Google, etc.).
- **Serverless Agents**: Define tools with simple callbacks in your existing code (Next.js API routes, Node.js services). No need for a separate "agent server" or complex Python microservices.
- **Smart Infrastructure**: Automatic model routing (cost/speed/quality), retries, and fallbacks.
- **Full Observability**: Real-time logs, cost tracking, and tool execution traces out of the box.

## Features

- **Unified Agent API**: Build agents that run anywhere.
- **Local Tool Callbacks**: Execute tools in your code, secure and simple.
- **Smart Model Routing**: Automatically optimize for cost, speed, or quality.
- **Multi-Provider Support**: Switch models without changing code.
- **Function Calling**: First-class support for OpenAI-compatible tools.
- **Streaming**: Built-in support for real-time responses.
- **TypeScript**: Full type safety included.

## Installation

```bash
npm install agentlify-js
# or
yarn add agentlify-js
```

## 🚀 Quick Start: Building an Agent

Create an agent that can interact with your local code or APIs using **tools with callbacks**.

```javascript
const Agentlify = require('agentlify-js');

const client = new Agentlify({
  apiKey: process.env.AGENTLIFY_API_KEY,
  routerId: process.env.AGENTLIFY_ROUTER_ID,
});

// Run an agent with a local tool
const response = await client.agents.run({
  agentId: 'my-agent', // Create in Agentlify dashboard
  messages: [{ role: 'user', content: 'What is the stock price of AAPL?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_stock_price',
        description: 'Get current stock price',
        parameters: {
          type: 'object',
          properties: { symbol: { type: 'string' } },
          required: ['symbol'],
        },
      },
      // This callback executes in YOUR code
      callback: async (args) => {
        // Call your DB, external API, etc.
        const price = await fetchStockAPI(args.symbol);
        return { price, currency: 'USD' };
      },
    },
  ],
});

console.log(response.choices[0].message.content);
```

## 📚 Core Concepts

### 1. Agents & Tools

Agents are the core of Agentlify. You can define them in the dashboard and run them via the SDK.
Tools can be **Webhooks** (server-side) or **Callbacks** (local).

```javascript
// Example: Database Query Tool
const response = await client.agents.run({
  agentId: 'data-assistant',
  messages: [{ role: 'user', content: 'Find users in New York' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'query_db',
        description: 'Query database',
        parameters: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
      callback: async (args) => {
        // Securely access your DB here
        return await db.users.find({ city: args.city });
      },
    },
  ],
});
```

### 2. Smart Routing

Stop hardcoding models. Let Agentlify route to the best model for the task.

```javascript
const completion = await client.chat.create({
  messages: [{ role: 'user', content: 'Analyze this complex contract...' }],
  // Agentlify selects GPT-4, Claude 3 Opus, or others based on your router config
});
```

### 3. Streaming

Stream responses to your frontend easily.

```javascript
const stream = await client.chat.create({
  messages: [{ role: 'user', content: 'Write a long story...' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

## ⚙️ Configuration

```javascript
const mp = new Agentlify({
  apiKey: 'your-api-key',
  routerId: 'YOUR_ROUTER_ID',
  timeout: 30000,
});
```

## 📖 Documentation

For full documentation, visit [docs.agentlify.co](https://docs.agentlify.co).

- [Agent Tools Guide](https://docs.agentlify.co/agents/tools)
- [SDK Reference](https://docs.agentlify.co/sdk)
- [Router Configuration](https://docs.agentlify.co/router)

## 🤝 Support

- 📧 **Email**: help@agentlify.co
- � **Issues**: [GitHub Issues](https://github.com/aposded/agentlify-js/issues)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.
