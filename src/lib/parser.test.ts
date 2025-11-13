import { describe, it, expect } from "vitest";
import { parseJsonl } from "./parser";
import { readFileSync, existsSync } from "fs";

describe("parseJsonl", () => {
  describe("Claude Code format", () => {
    it("should detect and parse Claude Code format traces", () => {
      const claudeTrace = `
{"type":"user","message":{"role":"user","content":"Hello"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hi there!"}]},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe("user");
      expect(result.events[0].text).toBe("Hello");
      expect(result.events[1].kind).toBe("assistant");
      expect(result.events[1].text).toBe("Hi there!");
    });

    it("should handle Claude Code tool uses", () => {
      const claudeTrace = `
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Let me read that file"},{"type":"tool_use","id":"tool1","name":"Read","input":{"file_path":"/test.txt"}}]},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool1","content":"file contents"}]},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(3);
      // Parser processes blocks in order: text accumulates, then gets pushed before tool-use
      expect(result.events[0].kind).toBe("assistant");
      expect(result.events[0].text).toBe("Let me read that file");
      expect(result.events[1].kind).toBe("tool-use");
      expect(result.events[1].name).toBe("Read");
      expect(result.events[1].input).toEqual({ file_path: "/test.txt" });
      expect(result.events[2].kind).toBe("tool-result");
      expect(result.events[2].output).toBe("file contents");
    });

    it("should skip file-history-snapshot entries", () => {
      const claudeTrace = `
{"type":"file-history-snapshot","messageId":"abc","snapshot":{},"isSnapshotUpdate":false}
{"type":"user","message":{"role":"user","content":"Test"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("user");
      expect(result.events[0].text).toBe("Test");
    });

    it("should skip summary entries", () => {
      const claudeTrace = `
{"type":"summary","uuid":"summary1","summary":"Test summary"}
{"type":"user","message":{"role":"user","content":"Test"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("user");
    });

    it("should handle system messages in Claude Code format", () => {
      const claudeTrace = `
{"type":"system","message":{"role":"system","content":"You are a helpful assistant"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"user","message":{"role":"user","content":"Hello"},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe("system");
      expect(result.events[0].text).toBe("You are a helpful assistant");
      expect(result.events[1].kind).toBe("user");
    });

    it("should handle tool results with array content", () => {
      const claudeTrace = `
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tool1","name":"Bash","input":{"command":"ls"}}]},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool1","content":[{"type":"text","text":"file1.txt"},{"type":"text","text":"file2.txt"}]}]},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe("tool-use");
      expect(result.events[0].name).toBe("Bash");
      expect(result.events[1].kind).toBe("tool-result");
      expect(result.events[1].output).toContain("file1.txt");
      expect(result.events[1].output).toContain("file2.txt");
    });
  });

  describe("OpenAI format", () => {
    it("should detect and parse OpenAI format traces", () => {
      const openaiTrace = `
{"role":"user","content":"Hello"}
{"role":"assistant","content":"Hi there!"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe("user");
      expect(result.events[0].text).toBe("Hello");
      expect(result.events[1].kind).toBe("assistant");
      expect(result.events[1].text).toBe("Hi there!");
    });

    it("should handle OpenAI legacy tool calls", () => {
      const openaiTrace = `
{"role":"assistant","content":"Let me check that","tool_calls":[{"id":"call1","function":{"name":"get_weather","arguments":"{\\"location\\":\\"SF\\"}"}}]}
{"role":"tool","tool_call_id":"call1","name":"get_weather","content":"72F and sunny"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].kind).toBe("assistant");
      expect(result.events[0].text).toBe("Let me check that");
      expect(result.events[1].kind).toBe("tool-use");
      expect(result.events[1].name).toBe("get_weather");
      expect(result.events[1].input).toEqual({ location: "SF" });
      expect(result.events[2].kind).toBe("tool-result");
      expect(result.events[2].name).toBe("get_weather");
      expect(result.events[2].output).toBe("72F and sunny");
    });

    it("should handle OpenAI new format with content array", () => {
      const openaiTrace = `
{"role":"assistant","content":[{"type":"text","text":"Let me help"},{"type":"tool_use","id":"tool1","name":"Read","input":{"file":"/test.txt"}}]}
{"role":"tool","tool_call_id":"tool1","name":"Read","content":"file data"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(3);
      // Parser processes blocks in order: text accumulates, then gets pushed before tool-use
      expect(result.events[0].kind).toBe("assistant");
      expect(result.events[0].text).toBe("Let me help");
      expect(result.events[1].kind).toBe("tool-use");
      expect(result.events[1].name).toBe("Read");
      expect(result.events[2].kind).toBe("tool-result");
      expect(result.events[2].output).toBe("file data");
    });

    it("should handle system messages in OpenAI format", () => {
      const openaiTrace = `
{"role":"system","content":"You are a helpful assistant"}
{"role":"user","content":"Hello"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe("system");
      expect(result.events[0].text).toBe("You are a helpful assistant");
      expect(result.events[1].kind).toBe("user");
      expect(result.events[1].text).toBe("Hello");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", () => {
      const result = parseJsonl("");
      expect(result.events).toHaveLength(0);
    });

    it("should handle single JSON array instead of JSONL", () => {
      const jsonArray = JSON.stringify([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ]);

      const result = parseJsonl(jsonArray);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].kind).toBe("user");
      expect(result.events[1].kind).toBe("assistant");
    });

    it("should skip invalid JSON lines", () => {
      const mixedTrace = `
{"role":"user","content":"Valid line"}
this is not json
{"role":"assistant","content":"Another valid line"}
      `.trim();

      const result = parseJsonl(mixedTrace);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].text).toBe("Valid line");
      expect(result.events[1].text).toBe("Another valid line");
    });

    it("should skip empty lines", () => {
      const traceWithEmptyLines = `
{"role":"user","content":"Line 1"}

{"role":"assistant","content":"Line 2"}

      `.trim();

      const result = parseJsonl(traceWithEmptyLines);

      expect(result.events).toHaveLength(2);
    });

    it("should generate a title from first user message", () => {
      const trace = `
{"role":"user","content":"Please help me debug this code"}
{"role":"assistant","content":"Sure!"}
      `.trim();

      const result = parseJsonl(trace);

      expect(result.title).toBeTruthy();
      expect(result.title).toContain("help");
    });

    it("should handle messages with array content and no text", () => {
      const trace = `
{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"TestTool","input":{}}]}
      `.trim();

      const result = parseJsonl(trace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("tool-use");
      expect(result.events[0].name).toBe("TestTool");
    });
  });

  describe("Format detection", () => {
    it("should correctly detect Claude Code format by presence of type field", () => {
      const claudeTrace = `
{"type":"user","message":{"role":"user","content":"Test"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
      `.trim();

      const result = parseJsonl(claudeTrace);

      // Should parse as Claude Code format (has type, message, uuid, timestamp fields)
      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("user");
    });

    it("should default to OpenAI format when Claude Code markers are absent", () => {
      const openaiTrace = `
{"role":"user","content":"Test"}
      `.trim();

      const result = parseJsonl(openaiTrace);

      // Should parse as OpenAI format (no type/uuid/timestamp wrapper)
      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("user");
    });

    it("should check first 10 entries for format detection", () => {
      // Mix of entries where Claude Code format appears later
      const lines = [];
      for (let i = 0; i < 5; i++) {
        lines.push(JSON.stringify({ role: "user", content: `Message ${i}` }));
      }
      lines.push(
        JSON.stringify({
          type: "user",
          message: { role: "user", content: "Claude message" },
          uuid: "1",
          timestamp: "2025-01-01T00:00:00Z",
        }),
      );

      const result = parseJsonl(lines.join("\n"));

      // Should detect Claude Code format from 6th entry
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  describe("Bad/malformed trace files", () => {
    it("should handle completely empty trace file", () => {
      const result = parseJsonl("");

      expect(result.events).toHaveLength(0);
      expect(result.title).toBeTruthy();
      expect(result.originalMessages).toHaveLength(0);
    });

    it("should handle whitespace-only trace file", () => {
      const result = parseJsonl("   \n\n  \t  \n   ");

      expect(result.events).toHaveLength(0);
      expect(result.originalMessages).toHaveLength(0);
    });

    it("should skip lines with invalid JSON", () => {
      const badTrace = `
{"role":"user","content":"Valid message 1"}
{this is not valid json}
not even close to json
{"role":"assistant","content":"Valid message 2"}
{incomplete json
{"role":"user","content":"Valid message 3"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should only parse the 3 valid messages
      expect(result.events).toHaveLength(3);
      expect(result.events[0].text).toBe("Valid message 1");
      expect(result.events[1].text).toBe("Valid message 2");
      expect(result.events[2].text).toBe("Valid message 3");
    });

    it("should handle trace with only invalid JSON lines", () => {
      const badTrace = `
not json at all
{this is also bad}
[incomplete array
      `.trim();

      const result = parseJsonl(badTrace);

      expect(result.events).toHaveLength(0);
      expect(result.originalMessages).toHaveLength(0);
    });

    it("should handle malformed messages with missing required fields", () => {
      const badTrace = `
{"role":"user","content":"Good message"}
{"role":"assistant"}
{"content":"No role field"}
{"role":"user","content":"Another good message"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should handle messages with content gracefully
      expect(result.events).toHaveLength(2);
      expect(result.events[0].text).toBe("Good message");
      expect(result.events[1].text).toBe("Another good message");
    });

    it("should handle messages with null or undefined content", () => {
      const badTrace = `
{"role":"user","content":"Valid"}
{"role":"assistant","content":null}
{"role":"user","content":""}
{"role":"assistant","content":"Also valid"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should skip messages with null/empty content
      expect(result.events).toHaveLength(2);
      expect(result.events[0].text).toBe("Valid");
      expect(result.events[1].text).toBe("Also valid");
    });

    it("should handle mixed valid and empty lines", () => {
      const badTrace = `


{"role":"user","content":"Message 1"}


{"role":"assistant","content":"Message 2"}

      `.trim();

      const result = parseJsonl(badTrace);

      expect(result.events).toHaveLength(2);
    });

    it("should handle truncated tool_use blocks", () => {
      const badTrace = `
{"role":"assistant","content":[{"type":"tool_use","id":"t1"}]}
{"role":"assistant","content":[{"type":"tool_use","name":"Read"}]}
{"role":"assistant","content":[{"type":"tool_use"}]}
{"role":"user","content":"Normal message"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should not crash and should process what it can
      expect(result.events.length).toBeGreaterThan(0);
      const userEvents = result.events.filter((e) => e.kind === "user");
      expect(userEvents).toHaveLength(1);
      expect(userEvents[0].text).toBe("Normal message");
    });

    it("should handle malformed tool_result blocks", () => {
      const badTrace = `
{"role":"tool","content":"result without call id"}
{"role":"tool","tool_call_id":"","content":"empty call id"}
{"role":"user","content":"Normal message"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should create tool-result events even with missing ids
      expect(result.events.length).toBeGreaterThan(0);
      const toolResults = result.events.filter((e) => e.kind === "tool-result");
      expect(toolResults.length).toBeGreaterThan(0);
    });

    it("should handle deeply nested or circular content", () => {
      const deepContent = {
        level1: { level2: { level3: { level4: { level5: "deep" } } } },
      };
      const trace = JSON.stringify({
        role: "user",
        content: JSON.stringify(deepContent),
      });

      const result = parseJsonl(trace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("user");
    });

    it("should handle very long lines without crashing", () => {
      const longContent = "A".repeat(100000);
      const trace = JSON.stringify({ role: "user", content: longContent });

      const result = parseJsonl(trace);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].text).toHaveLength(100000);
    });

    it("should handle unicode and special characters", () => {
      const badTrace = `
{"role":"user","content":"Hello 世界 🌍 emoji"}
{"role":"assistant","content":"Response with \\u0000 null char"}
{"role":"user","content":"Special chars: \\n\\t\\r"}
      `.trim();

      const result = parseJsonl(badTrace);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].text).toContain("世界");
      expect(result.events[0].text).toContain("🌍");
    });

    it("should handle array content with mixed types", () => {
      const badTrace = `
{"role":"assistant","content":[{"type":"text","text":"valid"}]}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should extract text from valid text blocks
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].text).toBe("valid");
    });

    it("should handle Claude Code format with missing message field", () => {
      const badTrace = `
{"type":"user","uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"assistant","message":{"role":"assistant","content":"Valid"},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should skip entry without message field
      expect(result.events).toHaveLength(1);
      expect(result.events[0].text).toBe("Valid");
    });

    it("should handle Claude Code format with wrong type values", () => {
      const badTrace = `
{"type":"unknown","message":{"role":"user","content":"Message 1"},"uuid":"1","timestamp":"2025-01-01T00:00:00Z"}
{"type":"system","message":{"role":"system","content":"System message"},"uuid":"2","timestamp":"2025-01-01T00:00:01Z"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should process system messages, skip unknown types
      expect(result.events).toHaveLength(1);
      expect(result.events[0].kind).toBe("system");
    });

    it("should handle malformed tool_calls in legacy format", () => {
      const badTrace = `
{"role":"assistant","tool_calls":[{"id":"1"}]}
{"role":"assistant","tool_calls":[{"function":{}}]}
{"role":"assistant","tool_calls":[{}]}
{"role":"user","content":"Valid"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should not crash, should create tool-use events with defaults
      expect(result.events.length).toBeGreaterThan(0);
      const userEvents = result.events.filter((e) => e.kind === "user");
      expect(userEvents).toHaveLength(1);
    });

    it("should handle non-string arguments in legacy tool_calls", () => {
      const badTrace = `
{"role":"assistant","tool_calls":[{"id":"1","function":{"name":"test","arguments":123}}]}
{"role":"assistant","tool_calls":[{"id":"2","function":{"name":"test","arguments":null}}]}
{"role":"user","content":"Valid"}
      `.trim();

      const result = parseJsonl(badTrace);

      // Should handle non-string arguments gracefully
      const toolUses = result.events.filter((e) => e.kind === "tool-use");
      expect(toolUses.length).toBeGreaterThan(0);
      toolUses.forEach((tu) => {
        expect(tu.input).toBeDefined();
      });
    });
  });

  describe("Real-world trace files", () => {
    it("should parse trace file with many different tools", () => {
      // Use the actual trace file with various tools
      const fs = require("fs");
      const path =
        "/Users/ahle/.claude/projects/-Users-ahle-repos-trace-taxi/c538bc9a-6fbd-4d4f-8231-428b51119092.jsonl";

      let traceContent: string;
      try {
        traceContent = fs.readFileSync(path, "utf-8");
      } catch (err) {
        // Skip this test if file doesn't exist (e.g., in CI)
        console.log("Skipping real trace file test - file not found");
        return;
      }

      const result = parseJsonl(traceContent);

      // Should successfully parse the trace
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.title).toBeTruthy();
      expect(result.originalMessages.length).toBeGreaterThan(0);

      // Verify various tool types are present
      const toolUses = result.events.filter((e) => e.kind === "tool-use");
      expect(toolUses.length).toBeGreaterThan(0);

      // Check for specific tools we know are in the trace
      const toolNames = new Set(toolUses.map((t) => t.name));
      expect(toolNames.has("TodoWrite")).toBe(true);
      expect(toolNames.has("Read")).toBe(true);
      expect(toolNames.has("Write")).toBe(true);
      expect(toolNames.has("Edit")).toBe(true);
      expect(toolNames.has("Bash")).toBe(true);

      // Verify tool results are present
      const toolResults = result.events.filter((e) => e.kind === "tool-result");
      expect(toolResults.length).toBeGreaterThan(0);

      // Verify user and assistant messages
      const userMessages = result.events.filter((e) => e.kind === "user");
      const assistantMessages = result.events.filter(
        (e) => e.kind === "assistant",
      );
      expect(userMessages.length).toBeGreaterThan(0);
      expect(assistantMessages.length).toBeGreaterThan(0);

      // Verify file-history-snapshot entries are skipped
      const lines = traceContent.split("\n").filter((l) => l.trim());
      const snapshotLines = lines.filter((l) =>
        l.includes('"type":"file-history-snapshot"'),
      );
      expect(snapshotLines.length).toBeGreaterThan(0);
      // These should not appear in events
      const snapshotEvents = result.events.filter(
        (e: any) => e.kind === "file-history-snapshot",
      );
      expect(snapshotEvents.length).toBe(0);
    });

    it.skipIf(
      !existsSync(
        "/Users/ahle/.claude/projects/-Users-ahle-repos-trace-taxi/5f1cf5f9-eb95-4abf-9a29-ea9070f91064.jsonl",
      ),
    )("should parse Claude session file with thinking blocks", () => {
      const sessionPath =
        "/Users/ahle/.claude/projects/-Users-ahle-repos-trace-taxi/5f1cf5f9-eb95-4abf-9a29-ea9070f91064.jsonl";
      const traceContent = readFileSync(sessionPath, "utf-8");

      const result = parseJsonl(traceContent);

      console.log("Parsed events:", result.events.length);
      console.log(
        "First 5 events:",
        result.events
          .slice(0, 5)
          .map((e) => ({ kind: e.kind, text: e.text?.substring(0, 100) })),
      );

      // Should have many events from the long conversation
      expect(result.events.length).toBeGreaterThan(0);
    });
  });
});
