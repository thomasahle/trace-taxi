#!/usr/bin/env node
// Converts OpenTelemetry-style trace to OpenAI message format (simplified)
import fs from 'fs';
import path from 'path';

function convertTrace(inputFile, outputFile) {
  const lines = fs.readFileSync(inputFile, 'utf8').split('\n').filter(Boolean);
  const messages = [];

  // Add initial user message
  messages.push({
    role: 'user',
    content: 'Create a UVM test for AXI4 testbench'
  });

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);

      // Check if this is an LLM turn
      if (obj.span_kind === 'LLM') {
        const outputValue = obj.attributes?.['output.value'] || '';

        // Check for tool calls in events
        if (obj.events && obj.events.length > 0) {
          const toolCalls = [];

          for (const event of obj.events) {
            if (event.name && event.name.startsWith('tool_call_')) {
              const toolName = event.attributes?.['tool.name'];
              const toolArgs = event.attributes?.['tool.arguments'];
              const toolId = event.attributes?.['tool.call_id'];

              if (toolName) {
                toolCalls.push({
                  id: toolId || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                  type: 'function',
                  function: {
                    name: toolName,
                    arguments: typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs)
                  }
                });
              }
            }
          }

          // Add assistant message with tool calls
          if (toolCalls.length > 0) {
            messages.push({
              role: 'assistant',
              content: outputValue || 'Let me check that for you.',
              tool_calls: toolCalls
            });

            // Add mock tool response for each tool call
            for (const toolCall of toolCalls) {
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: `[Tool output for ${toolCall.function.name}]\n\nFile/data accessed successfully.`
              });
            }
          }
        } else if (outputValue) {
          // Regular assistant message without tool calls
          messages.push({
            role: 'assistant',
            content: outputValue
          });
        }
      }
    } catch (e) {
      console.error('Error parsing line:', e.message);
    }
  }

  // Write output as JSONL
  const output = messages.map(m => JSON.stringify(m)).join('\n');
  fs.writeFileSync(outputFile, output);

  console.log(`Converted ${lines.length} trace events to ${messages.length} messages`);
  console.log(`Output written to: ${outputFile}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node convert-trace-simple.js <input-trace.jsonl> [output-messages.jsonl]');
  process.exit(1);
}

const inputFile = path.resolve(args[0]);
const outputFile = args[1] ? path.resolve(args[1]) : inputFile.replace(/\.jsonl?$/, '-openai.jsonl');

if (!fs.existsSync(inputFile)) {
  console.error('Input file not found:', inputFile);
  process.exit(1);
}

convertTrace(inputFile, outputFile);