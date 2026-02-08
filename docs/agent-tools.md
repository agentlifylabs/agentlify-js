# Agent Tools Guide

This guide explains how to use Agentlify agents with custom tools. Tools allow agents to interact with external systems, APIs, and your application code.

## Overview

Agentlify supports two ways to provide tools to agents:

| Method             | Execution Location | Use Case                                          |
| ------------------ | ------------------ | ------------------------------------------------- |
| **Callback Tools** | Your code (SDK)    | Local integrations, databases, APIs with secrets  |
| **Webhook Tools**  | Agent server       | Stateless HTTP services, third-party integrations |

## Quick Start

```javascript
const Agentlify = require('agentlify');

const client = new Agentlify({
  apiKey: 'mp_your_api_key',
  routerId: 'your_router_id',
});

// Run agent with a tool that executes locally
const response = await client.agents.run({
  agentId: 'your-agent-id',
  messages: [{ role: 'user', content: 'What is 25 * 4?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'calculate',
        description: 'Perform a calculation',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
          },
          required: ['expression'],
        },
      },
      // Callback executes in YOUR code
      callback: async (args) => {
        return { result: eval(args.expression) };
      },
    },
  ],
});

console.log(response.choices[0].message.content);
```

## Callback Tools (SDK)

Callback tools execute in your application code, giving you full control over implementation and access to local resources.

### How It Works

1. You define a tool with a `callback` function
2. Agent receives the tool definition (without the callback)
3. When agent calls the tool, SDK intercepts the call
4. SDK executes your callback locally
5. SDK sends the result back to the agent
6. Agent continues with the tool result

### Example: Database Query

```javascript
const response = await client.agents.run({
  agentId: 'data-assistant',
  messages: [
    { role: 'user', content: 'Show me users who signed up this week' },
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'query_users',
        description: 'Query the users database',
        parameters: {
          type: 'object',
          properties: {
            filter: { type: 'object', description: 'Query filters' },
            limit: { type: 'number', description: 'Max results' },
          },
        },
      },
      callback: async (args) => {
        // Access your database directly
        const users = await db.users
          .find({
            createdAt: { $gte: weekAgo() },
            ...args.filter,
          })
          .limit(args.limit || 10);

        return { users, count: users.length };
      },
    },
  ],
});
```

### Example: API Integration

```javascript
const response = await client.agents.run({
  agentId: 'support-agent',
  messages: [{ role: 'user', content: 'Create a ticket for login issue' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'create_support_ticket',
        description: 'Create a support ticket in the system',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            description: { type: 'string' },
          },
          required: ['title', 'description'],
        },
      },
      callback: async (args) => {
        // Use your API keys securely
        const ticket = await zendesk.tickets.create({
          subject: args.title,
          priority: args.priority || 'medium',
          comment: { body: args.description },
        });

        return { ticketId: ticket.id, url: ticket.url };
      },
    },
  ],
});
```

### Error Handling

Return errors as part of the result - the agent will see them and respond appropriately:

```javascript
callback: async (args) => {
  try {
    const result = await riskyOperation(args);
    return { success: true, data: result };
  } catch (error) {
    // Agent sees this error and can inform the user
    return { success: false, error: error.message };
  }
};
```

## Webhook Tools (Server-Side)

Webhook tools are defined in the agent configuration and execute on the Agentlify server by calling your HTTP endpoints.

### Configuration

Add tools with `webhookUrl` to your agent configuration in the Agentlify dashboard:

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "check_inventory",
        "description": "Check product inventory",
        "parameters": {
          "type": "object",
          "properties": {
            "product_id": { "type": "string" }
          },
          "required": ["product_id"]
        }
      },
      "webhookUrl": "https://api.yourcompany.com/inventory/check",
      "timeout": 10000,
      "headers": {
        "X-API-Key": "your-api-key"
      }
    }
  ]
}
```

### Webhook Request Format

Your webhook receives a POST request with:

```json
{
  "tool_name": "check_inventory",
  "arguments": {
    "product_id": "SKU-123"
  },
  "agent_id": "agent-id",
  "execution_id": "exec-uuid"
}
```

### Webhook Response

Return JSON that will be passed to the agent:

```json
{
  "product_id": "SKU-123",
  "in_stock": true,
  "quantity": 42,
  "warehouse": "US-WEST"
}
```

## Manual Tool Handling

For advanced use cases, use `execute()` instead of `run()` to handle tool calls manually:

```javascript
// Single request - returns immediately even if tools are needed
let response = await client.agents.execute({
  agentId: 'my-agent',
  messages: [{ role: 'user', content: 'Get my account balance' }],
  tools: [
    {
      /* tool definition without callback */
    },
  ],
});

// Check if agent needs tool execution
if (response.agent_metadata?.requires_tool_execution) {
  const toolCalls = response.choices[0].message.tool_calls;

  // Execute tools yourself
  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      const args = JSON.parse(tc.function.arguments);
      const result = await myToolHandler(tc.function.name, args);
      return {
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      };
    }),
  );

  // Continue conversation with results
  response = await client.agents.execute({
    agentId: 'my-agent',
    messages: [
      ...previousMessages,
      { role: 'assistant', content: null, tool_calls: toolCalls },
      ...results.map((r) => ({ role: 'tool', ...r })),
    ],
    tools: [
      {
        /* same tools */
      },
    ],
  });
}
```

## Methods Comparison

| Method             | Auto Tool Execution | Max Iterations             | Use Case            |
| ------------------ | ------------------- | -------------------------- | ------------------- |
| `agents.run()`     | ✅ Yes              | Configurable (default: 10) | Most use cases      |
| `agents.execute()` | ❌ No               | N/A                        | Custom control flow |

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import Agentlify, { AgentTool, AgentRunParams, AgentResponse } from 'agentlify';

const tool: AgentTool = {
  type: 'function',
  function: {
    name: 'my_tool',
    description: 'Does something useful',
    parameters: { type: 'object', properties: {} },
  },
  callback: async (args: Record<string, any>) => {
    return { result: 'done' };
  },
};

const params: AgentRunParams = {
  agentId: 'my-agent',
  messages: [{ role: 'user', content: 'Hello' }],
  tools: [tool],
  maxToolIterations: 5,
};

const response: AgentResponse = await client.agents.run(params);
```

## Best Practices

### 1. Keep Callbacks Fast

Tool callbacks should complete quickly. For long-running operations, consider:

- Returning an operation ID and having the user ask for status
- Using webhooks with async processing

### 2. Provide Clear Descriptions

Good tool descriptions help the agent use tools correctly:

```javascript
// ✅ Good
function: {
  name: 'search_products',
  description: 'Search for products by name, category, or price range. Returns up to 10 results.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search terms (e.g., "blue shoes")' },
      category: { type: 'string', description: 'Product category filter' },
      maxPrice: { type: 'number', description: 'Maximum price in USD' }
    }
  }
}

// ❌ Bad
function: {
  name: 'search',
  description: 'Search stuff',
  parameters: { type: 'object', properties: { q: { type: 'string' } } }
}
```

### 3. Validate Inputs

Always validate tool arguments:

```javascript
callback: async (args) => {
  if (!args.email || !args.email.includes('@')) {
    return { error: 'Invalid email address' };
  }
  // ... continue with valid input
};
```

### 4. Return Structured Data

Return structured responses for better agent understanding:

```javascript
// ✅ Good
return {
  success: true,
  order: {
    id: 'ORD-123',
    status: 'confirmed',
    items: 3,
    total: 59.99,
  },
};

// ❌ Bad
return 'Order ORD-123 confirmed with 3 items totaling $59.99';
```

### 5. Set Appropriate Iteration Limits

Prevent infinite loops by setting `maxToolIterations`:

```javascript
const response = await client.agents.run({
  agentId: 'my-agent',
  messages: [...],
  tools: [...],
  maxToolIterations: 5  // Default is 10
});
```

## Troubleshooting

### Tool Not Being Called

- Check that the tool description clearly explains when to use it
- Ensure parameters match what the agent needs
- Verify the agent has tool-calling capability enabled

### Callback Errors

- Wrap callback logic in try-catch
- Return errors as structured data, not thrown exceptions
- Check for missing required arguments

### Webhook Failures

- Verify the webhook URL is accessible
- Check timeout settings (default: 30 seconds)
- Ensure correct headers are configured
- Return valid JSON responses
