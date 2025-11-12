import { describe, it, expect } from 'vitest';
import { parseJsonl } from './parser';

describe('parseJsonl', () => {
  describe('Claude Code format', () => {
    it('should detect and parse Claude Code format traces', () => {
      const claudeTrace = `
{"type":"user","message":{"role":"user","content":"Hello"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hi there!"}]},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe('user');
      expect(result.events[0].text).toBe('Hello');
      expect(result.events[1].kind).toBe('assistant');
      expect(result.events[1].text).toBe('Hi there!');
    });

    it('should handle Claude Code tool uses', () => {
      const claudeTrace = `
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Let me read that file"},{"type":"tool_use","id":"tool1","name":"Read","input":{"file_path":"/test.txt"}}]},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool1","content":"file contents"}]},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(3);
      // Parser pushes tool-use first, then assistant text
      expect(result.events[0].kind).toBe('tool-use');
      expect(result.events[0].name).toBe('Read');
      expect(result.events[0].input).toEqual({ file_path: '/test.txt' });
      expect(result.events[1].kind).toBe('assistant');
      expect(result.events[1].text).toBe('Let me read that file');
      expect(result.events[2].kind).toBe('tool-result');
      expect(result.events[2].output).toBe('file contents');
    });

    it('should skip file-history-snapshot entries', () => {
      const claudeTrace = `
{"type":"file-history-snapshot","messageId":"abc","snapshot":{},"isSnapshotUpdate":false}
{"type":"user","message":{"role":"user","content":"Test"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe('user');
      expect(result.events[0].text).toBe('Test');
    });

    it('should skip summary entries', () => {
      const claudeTrace = `
{"type":"summary","uuid":"summary1","summary":"Test summary"}
{"type":"user","message":{"role":"user","content":"Test"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe('user');
    });

    it('should handle system messages in Claude Code format', () => {
      const claudeTrace = `
{"type":"system","message":{"role":"system","content":"You are a helpful assistant"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"user","message":{"role":"user","content":"Hello"},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe('system');
      expect(result.events[0].text).toBe('You are a helpful assistant');
      expect(result.events[1].kind).toBe('user');
    });

    it('should handle tool results with array content', () => {
      const claudeTrace = `
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tool1","name":"Bash","input":{"command":"ls"}}]},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool1","content":[{"type":"text","text":"file1.txt"},{"type":"text","text":"file2.txt"}]}]},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe('tool-use');
      expect(result.events[0].name).toBe('Bash');
      expect(result.events[1].kind).toBe('tool-result');
      expect(result.events[1].output).toContain('file1.txt');
      expect(result.events[1].output).toContain('file2.txt');
    });
  });

  describe('OpenAI format', () => {
    it('should detect and parse OpenAI format traces', () => {
      const openaiTrace = `
{"role":"user","content":"Hello"}
{"role":"assistant","content":"Hi there!"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe('user');
      expect(result.events[0].text).toBe('Hello');
      expect(result.events[1].kind).toBe('assistant');
      expect(result.events[1].text).toBe('Hi there!');
    });

    it('should handle OpenAI legacy tool calls', () => {
      const openaiTrace = `
{"role":"assistant","content":"Let me check that","tool_calls":[{"id":"call1","function":{"name":"get_weather","arguments":"{\\"location\\":\\"SF\\"}"}}]}
{"role":"tool","tool_call_id":"call1","name":"get_weather","content":"72F and sunny"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].kind).toBe('assistant');
      expect(result.events[0].text).toBe('Let me check that');
      expect(result.events[1].kind).toBe('tool-use');
      expect(result.events[1].name).toBe('get_weather');
      expect(result.events[1].input).toEqual({ location: 'SF' });
      expect(result.events[2].kind).toBe('tool-result');
      expect(result.events[2].name).toBe('get_weather');
      expect(result.events[2].output).toBe('72F and sunny');
    });

    it('should handle OpenAI new format with content array', () => {
      const openaiTrace = `
{"role":"assistant","content":[{"type":"text","text":"Let me help"},{"type":"tool_use","id":"tool1","name":"Read","input":{"file":"/test.txt"}}]}
{"role":"tool","tool_call_id":"tool1","name":"Read","content":"file data"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(3);
      // Parser pushes tool-use first, then assistant text
      expect(result.events[0].kind).toBe('tool-use');
      expect(result.events[0].name).toBe('Read');
      expect(result.events[1].kind).toBe('assistant');
      expect(result.events[1].text).toBe('Let me help');
      expect(result.events[2].kind).toBe('tool-result');
      expect(result.events[2].output).toBe('file data');
    });

    it('should handle system messages in OpenAI format', () => {
      const openaiTrace = `
{"role":"system","content":"You are a helpful assistant"}
{"role":"user","content":"Hello"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe('system');
      expect(result.events[0].text).toBe('You are a helpful assistant');
      expect(result.events[1].kind).toBe('user');
      expect(result.events[1].text).toBe('Hello');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const result = parseJsonl('');
      expect(result.events).toHaveLength(0);
    });

    it('should handle single JSON array instead of JSONL', () => {
      const jsonArray = JSON.stringify([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ]);

      const result = parseJsonl(jsonArray);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe('user');
      expect(result.events[1].kind).toBe('assistant');
    });

    it('should skip invalid JSON lines', () => {
      const mixedTrace = `
{"role":"user","content":"Valid line"}
this is not json
{"role":"assistant","content":"Another valid line"}
      `.trim();

      const result = parseJsonl(mixedTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].text).toBe('Valid line');
      expect(result.events[1].text).toBe('Another valid line');
    });

    it('should skip empty lines', () => {
      const traceWithEmptyLines = `
{"role":"user","content":"Line 1"}

{"role":"assistant","content":"Line 2"}

      `.trim();

      const result = parseJsonl(traceWithEmptyLines);

      expect(result.events).toHaveLength(2);
    });

    it('should generate a title from first user message', () => {
      const trace = `
{"role":"user","content":"Please help me debug this code"}
{"role":"assistant","content":"Sure!"}
      `.trim();

      const result = parseJsonl(trace);

      expect(result.title).toBeTruthy();
      expect(result.title).toContain('help');
    });

    it('should handle messages with array content and no text', () => {
      const trace = `
{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"TestTool","input":{}}]}
      `.trim();

      const result = parseJsonl(trace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe('tool-use');
      expect(result.events[0].name).toBe('TestTool');
    });
  });

  describe('Format detection', () => {
    it('should correctly detect Claude Code format by presence of type field', () => {
      const claudeTrace = `
{"type":"user","message":{"role":"user","content":"Test"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      // Should parse as Claude Code format (has type, message, uuid, timestamp fields)
      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe('user');
    });

    it('should default to OpenAI format when Claude Code markers are absent', () => {
      const openaiTrace = `
{"role":"user","content":"Test"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      // Should parse as OpenAI format (no type/uuid/timestamp wrapper)
      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe('user');
    });

    it('should check first 10 entries for format detection', () => {
      // Mix of entries where Claude Code format appears later
      const lines = [];
      for (let i = 0; i < 5; i++) {
        lines.push(JSON.stringify({ role: 'user', content: `Message ${i}` }));
      }
      lines.push(JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Claude message' },
        uuid: '1',
        timestamp: '2025-01-01T00:00:00Z'
      }));

      const result = parseJsonl(lines.join('\n'));

      // Should detect Claude Code format from 6th entry
      expect(result.events.length).toBeGreaterThan(0);
    });
  });
});
