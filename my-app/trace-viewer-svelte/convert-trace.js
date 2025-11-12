#!/usr/bin/env node
// Converts OpenTelemetry-style trace to OpenAI message format
import fs from 'fs';
import path from 'path';

function convertTrace(inputFile, outputFile) {
  const lines = fs.readFileSync(inputFile, 'utf8').split('\n').filter(Boolean);
  const messages = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);

      // Check if this is an LLM turn
      if (obj.span_kind === 'LLM') {
        // Extract the output value (assistant message)
        const outputValue = obj.attributes?.['output.value'] || '';

        // Check for tool calls in events
        const toolCalls = [];
        const toolResults = [];

        if (obj.events && obj.events.length > 0) {
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
            } else if (event.name && event.name.startsWith('tool_result_')) {
              const toolId = event.attributes?.['tool.call_id'];
              const toolOutput = event.attributes?.['tool.output'] || event.attributes?.['output'] || '';
              const toolName = event.attributes?.['tool.name'] || 'unknown';

              toolResults.push({
                role: 'tool',
                tool_call_id: toolId,
                name: toolName,
                content: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput)
              });
            }
          }
        }

        // Add assistant message if there's output or tool calls
        if (outputValue || toolCalls.length > 0) {
          const message = {
            role: 'assistant',
            content: outputValue
          };

          if (toolCalls.length > 0) {
            message.tool_calls = toolCalls;
          }

          messages.push(message);
        }

        // Add tool results after the assistant message
        for (const toolResult of toolResults) {
          messages.push(toolResult);
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
  console.error('Usage: node convert-trace.js <input-trace.jsonl> [output-messages.jsonl]');
  process.exit(1);
}

const inputFile = path.resolve(args[0]);
const outputFile = args[1] ? path.resolve(args[1]) : inputFile.replace(/\.jsonl?$/, '-converted.jsonl');

if (!fs.existsSync(inputFile)) {
  console.error('Input file not found:', inputFile);
  process.exit(1);
}

convertTrace(inputFile, outputFile);