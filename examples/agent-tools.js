/**
 * Agentlify Agent Tools Example
 * 
 * This example demonstrates how to use agents with local tool callbacks.
 * Tools execute in YOUR code, giving you full control over tool implementation.
 */

const Agentlify=require('modelpilot');

// Initialize client
const client=new Agentlify({
  apiKey: process.env.AGENTLIFY_API_KEY,
  routerId: process.env.AGENTLIFY_ROUTER_ID
});

// =============================================================================
// Example 1: Basic Tool with Callback
// =============================================================================

async function basicToolExample() {
  console.log('\n=== Example 1: Basic Tool with Callback ===\n');

  const response=await client.agents.run({
    agentId: 'your-agent-id',
    messages: [
      {role: 'user',content: 'What is the weather in San Francisco?'}
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name, e.g., "San Francisco, CA"'
            },
            unit: {
              type: 'string',
              enum: ['celsius','fahrenheit'],
              description: 'Temperature unit'
            }
          },
          required: ['location']
        }
      },
      // This callback executes in YOUR code when the agent calls this tool
      callback: async (args) => {
        console.log(`Tool called with args:`,args);

        // Your implementation - call a real weather API, database, etc.
        // For this example, we'll return mock data
        return {
          location: args.location,
          temperature: 68,
          unit: args.unit||'fahrenheit',
          conditions: 'Partly cloudy',
          humidity: 65
        };
      }
    }]
  });

  console.log('Agent response:',response.choices[0].message.content);
  console.log('Metadata:',response.agent_metadata);
}

// =============================================================================
// Example 2: Multiple Tools
// =============================================================================

async function multipleToolsExample() {
  console.log('\n=== Example 2: Multiple Tools ===\n');

  const response=await client.agents.run({
    agentId: 'your-agent-id',
    messages: [
      {role: 'user',content: 'Search for "AI news" and then summarize the top result'}
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: {type: 'string',description: 'Search query'}
            },
            required: ['query']
          }
        },
        callback: async (args) => {
          console.log(`Searching for: ${args.query}`);
          // Your search implementation
          return {
            results: [
              {title: 'Latest AI Developments',url: 'https://example.com/ai',snippet: 'New breakthroughs in...'},
              {title: 'AI in Healthcare',url: 'https://example.com/health',snippet: 'AI is transforming...'}
            ]
          };
        }
      },
      {
        type: 'function',
        function: {
          name: 'fetch_url',
          description: 'Fetch content from a URL',
          parameters: {
            type: 'object',
            properties: {
              url: {type: 'string',description: 'URL to fetch'}
            },
            required: ['url']
          }
        },
        callback: async (args) => {
          console.log(`Fetching URL: ${args.url}`);
          // Your URL fetching implementation
          return {
            content: 'Full article content here...',
            title: 'Latest AI Developments'
          };
        }
      }
    ]
  });

  console.log('Agent response:',response.choices[0].message.content);
}

// =============================================================================
// Example 3: Database Integration
// =============================================================================

async function databaseToolExample() {
  console.log('\n=== Example 3: Database Integration ===\n');

  // Simulate a database
  const database={
    users: [
      {id: 1,name: 'Alice',email: 'alice@example.com',role: 'admin'},
      {id: 2,name: 'Bob',email: 'bob@example.com',role: 'user'},
      {id: 3,name: 'Charlie',email: 'charlie@example.com',role: 'user'}
    ]
  };

  const response=await client.agents.run({
    agentId: 'your-agent-id',
    messages: [
      {role: 'user',content: 'List all admin users in the system'}
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'query_database',
        description: 'Query the user database',
        parameters: {
          type: 'object',
          properties: {
            table: {type: 'string',description: 'Table to query'},
            filter: {
              type: 'object',
              description: 'Filter conditions as key-value pairs'
            }
          },
          required: ['table']
        }
      },
      callback: async (args) => {
        console.log(`Querying ${args.table} with filter:`,args.filter);

        if(args.table==='users') {
          let results=database.users;
          if(args.filter) {
            results=results.filter(user => {
              return Object.entries(args.filter).every(
                ([key,value]) => user[key]===value
              );
            });
          }
          return {rows: results,count: results.length};
        }

        return {error: `Unknown table: ${args.table}`};
      }
    }]
  });

  console.log('Agent response:',response.choices[0].message.content);
}

// =============================================================================
// Example 4: Manual Tool Handling (without callbacks)
// =============================================================================

async function manualToolHandling() {
  console.log('\n=== Example 4: Manual Tool Handling ===\n');

  // Use execute() instead of run() when you want to handle tools manually
  let response=await client.agents.execute({
    agentId: 'your-agent-id',
    messages: [
      {role: 'user',content: 'What time is it?'}
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'get_current_time',
        description: 'Get the current time',
        parameters: {type: 'object',properties: {}}
      }
      // No callback - we'll handle it manually
    }]
  });

  // Check if tool execution is required
  if(response.agent_metadata?.requires_tool_execution) {
    const toolCalls=response.choices[0].message.tool_calls;
    console.log('Agent requested tools:',toolCalls);

    // Execute tools manually
    const toolResults=toolCalls.map(tc => ({
      tool_call_id: tc.id,
      content: JSON.stringify({time: new Date().toISOString()})
    }));

    // Continue the conversation with tool results
    const messages=[
      {role: 'user',content: 'What time is it?'},
      {role: 'assistant',content: null,tool_calls: toolCalls},
      ...toolResults.map(r => ({role: 'tool',...r}))
    ];

    // Call again with results
    response=await client.agents.execute({
      agentId: 'your-agent-id',
      messages,
      tools: [{ /* same tool definition */}]
    });
  }

  console.log('Final response:',response.choices[0].message.content);
}

// =============================================================================
// Example 5: Error Handling in Callbacks
// =============================================================================

async function errorHandlingExample() {
  console.log('\n=== Example 5: Error Handling in Callbacks ===\n');

  const response=await client.agents.run({
    agentId: 'your-agent-id',
    messages: [
      {role: 'user',content: 'Send an email to test@example.com'}
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'send_email',
        description: 'Send an email',
        parameters: {
          type: 'object',
          properties: {
            to: {type: 'string',description: 'Recipient email'},
            subject: {type: 'string',description: 'Email subject'},
            body: {type: 'string',description: 'Email body'}
          },
          required: ['to','subject','body']
        }
      },
      callback: async (args) => {
        try {
          // Validate input
          if(!args.to.includes('@')) {
            throw new Error('Invalid email address');
          }

          // Your email sending logic
          console.log(`Sending email to ${args.to}...`);

          // Simulate success
          return {success: true,messageId: 'msg_123'};
        } catch(error) {
          // Return error as result - agent will see this and can respond appropriately
          return {success: false,error: error.message};
        }
      }
    }]
  });

  console.log('Agent response:',response.choices[0].message.content);
}

// =============================================================================
// Run Examples
// =============================================================================

async function main() {
  try {
    await basicToolExample();
    await multipleToolsExample();
    await databaseToolExample();
    await manualToolHandling();
    await errorHandlingExample();
  } catch(error) {
    console.error('Error:',error.message);
  }
}

main();
