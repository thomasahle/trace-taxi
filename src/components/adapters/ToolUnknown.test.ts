import { describe, it, expect } from 'vitest';

// Extract the formatOutput function logic for testing
function formatOutput(output: any): string {
  if (!output) return "";

  let textToFormat = "";

  // Extract text from various formats
  if (typeof output === "string") {
    textToFormat = output;
  } else if (Array.isArray(output)) {
    // Handle array of content blocks - join without adding extra newlines
    textToFormat = output
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.type === "text" && item?.text) return item.text;
        return JSON.stringify(item);
      })
      .join("");
  } else {
    // Already an object
    textToFormat = JSON.stringify(output);
  }

  // Try to parse and reformat as JSON with single-space indent
  const trimmed = textToFormat.trim();
  try {
    const parsed = JSON.parse(trimmed);
    const formatted = JSON.stringify(parsed, null, 1);
    return formatted;
  } catch (e) {
    // Not valid JSON, return as-is
    return textToFormat;
  }
}

describe('ToolUnknown formatOutput', () => {
  it('should format simple JSON strings', () => {
    const output = '{"foo":"bar","baz":123}';
    const result = formatOutput(output);

    expect(result).toContain('"foo": "bar"');
    expect(result).toContain('"baz": 123');
  });

  it('should handle array of text content blocks', () => {
    const output = [
      { type: "text", text: '{"response": [' },
      { type: "text", text: '{"value": 42}' },
      { type: "text", text: ']}' }
    ];

    const result = formatOutput(output);
    const parsed = JSON.parse(result);

    expect(parsed).toEqual({
      response: [{ value: 42 }]
    });
  });

  it('should handle ThetaData-style output with escaped newlines and tabs', () => {
    // This simulates the actual structure from the Claude Code trace
    const output = [
      {
        type: "text",
        text: '{\n\t"response": [\n\t\t{\n\t\t\t"contract": {"strike":200.000,"right":"CALL","expiration":"2025-11-21","symbol":"NVDA"},\n\t\t\t"data": [\n\t\t\t\t{"delta":0.3931,"vega":11.6809,"theta":-0.4239}\n\t\t\t]\n\t\t}\n\t]\n}'
      },
      {
        type: "text",
        text: "\n"
      }
    ];

    const result = formatOutput(output);
    const parsed = JSON.parse(result);

    expect(parsed.response).toBeDefined();
    expect(parsed.response[0].contract.symbol).toBe("NVDA");
    expect(parsed.response[0].contract.strike).toBe(200.000);
    expect(parsed.response[0].data[0].delta).toBe(0.3931);
    expect(parsed.response[0].data[0].vega).toBe(11.6809);
    expect(parsed.response[0].data[0].theta).toBe(-0.4239);
  });

  it('should return non-JSON text as-is', () => {
    const output = "This is plain text, not JSON";
    const result = formatOutput(output);

    expect(result).toBe("This is plain text, not JSON");
  });

  it('should handle already-parsed objects', () => {
    const output = { foo: "bar", nested: { value: 123 } };
    const result = formatOutput(output);
    const parsed = JSON.parse(result);

    expect(parsed).toEqual(output);
  });

  it('should handle empty output', () => {
    expect(formatOutput(null)).toBe("");
    expect(formatOutput(undefined)).toBe("");
    expect(formatOutput("")).toBe("");
  });

  it('should use single-space indentation', () => {
    const output = '{"foo":"bar","nested":{"a":1,"b":2}}';
    const result = formatOutput(output);

    // Single-space indent means one space per level
    expect(result).toContain(' "foo"');
    expect(result).toContain(' "nested"');
    expect(result).toContain('  "a"'); // Two spaces for nested level
  });
});
