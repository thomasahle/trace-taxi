import { describe, it, expect } from 'vitest';
import { isObject, textFromContent, guessTitle, groupToolPairs, cn } from './utils';

describe('isObject', () => {
  it('should return true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ key: 'value' })).toBe(true);
    expect(isObject({ nested: { object: true } })).toBe(true);
  });

  it('should return false for arrays', () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
    expect(isObject(['a', 'b'])).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(Symbol('test'))).toBe(false);
  });

  it('should return true for object-like values', () => {
    expect(isObject(new Date())).toBe(true);
    expect(isObject(/regex/)).toBe(true);
    expect(isObject(new Error())).toBe(true);
  });
});

describe('textFromContent', () => {
  it('should return string content as-is', () => {
    expect(textFromContent('Hello world')).toBe('Hello world');
    expect(textFromContent('')).toBe('');
    expect(textFromContent('Line 1\nLine 2')).toBe('Line 1\nLine 2');
  });

  it('should extract text from array of strings', () => {
    expect(textFromContent(['Hello', 'World'])).toBe('Hello\nWorld');
    expect(textFromContent(['Single'])).toBe('Single');
  });

  it('should extract text from array of objects with text field', () => {
    expect(textFromContent([
      { type: 'text', text: 'First' },
      { type: 'text', text: 'Second' }
    ])).toBe('First\nSecond');
  });

  it('should extract text from array of objects with text.value field', () => {
    expect(textFromContent([
      { type: 'text', text: { value: 'Nested' } }
    ])).toBe('Nested');
  });

  it('should extract text from array of objects with value field', () => {
    expect(textFromContent([
      { value: 'Direct value' }
    ])).toBe('Direct value');
  });

  it('should extract text from array of objects with content field', () => {
    expect(textFromContent([
      { content: 'Content field' }
    ])).toBe('Content field');
  });

  it('should handle mixed array content', () => {
    expect(textFromContent([
      'String item',
      { text: 'Object text' },
      { type: 'text', text: { value: 'Nested value' } },
      { value: 'Direct value' }
    ])).toBe('String item\nObject text\nNested value\nDirect value');
  });

  it('should skip array items without extractable text', () => {
    expect(textFromContent([
      { type: 'image' },
      { text: 'Valid' },
      { notext: 'field' }
    ])).toBe('Valid');
  });

  it('should handle object with text field', () => {
    expect(textFromContent({ text: 'Simple object' })).toBe('Simple object');
  });

  it('should handle object with text.value field', () => {
    expect(textFromContent({ text: { value: 'Nested object' } })).toBe('Nested object');
  });

  it('should return empty string for non-extractable content', () => {
    expect(textFromContent(null)).toBe('');
    expect(textFromContent(undefined)).toBe('');
    expect(textFromContent(42)).toBe('');
    expect(textFromContent(true)).toBe('');
    expect(textFromContent({})).toBe('');
    expect(textFromContent({ notext: 'here' })).toBe('');
  });

  it('should trim whitespace from array results', () => {
    expect(textFromContent([
      '  ',
      { text: 'Valid' },
      '  '
    ])).toBe('Valid');
  });

  it('should handle empty arrays', () => {
    expect(textFromContent([])).toBe('');
  });
});

describe('guessTitle', () => {
  it('should use metadata.title if available', () => {
    const messages = [
      { role: 'user', content: 'Hello', metadata: { title: 'Custom Title' } }
    ];
    expect(guessTitle(messages)).toBe('Custom Title');
  });

  it('should use first user message content if no metadata', () => {
    const messages = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'First user message' },
      { role: 'assistant', content: 'Response' }
    ];
    expect(guessTitle(messages)).toBe('First user message');
  });

  it('should truncate long titles to 64 characters', () => {
    const longMessage = 'A'.repeat(100);
    const messages = [
      { role: 'user', content: longMessage }
    ];
    expect(guessTitle(messages)).toBe('A'.repeat(64));
  });

  it('should handle array content in user messages', () => {
    const messages = [
      { role: 'user', content: [{ type: 'text', text: 'Array content' }] }
    ];
    expect(guessTitle(messages)).toBe('Array content');
  });

  it('should return "Trace" if no user message found', () => {
    const messages = [
      { role: 'system', content: 'System only' },
      { role: 'assistant', content: 'Assistant only' }
    ];
    expect(guessTitle(messages)).toBe('Trace');
  });

  it('should return "Trace" for empty messages array', () => {
    expect(guessTitle([])).toBe('Trace');
  });

  it('should return "Trace" if user message has empty content', () => {
    const messages = [
      { role: 'user', content: '' }
    ];
    expect(guessTitle(messages)).toBe('Trace');
  });

  it('should prefer metadata.title over user message', () => {
    const messages = [
      { role: 'user', content: 'User message' },
      { role: 'assistant', content: 'Response', metadata: { title: 'Metadata Title' } }
    ];
    expect(guessTitle(messages)).toBe('Metadata Title');
  });

  it('should handle messages with null or undefined content', () => {
    const messages = [
      { role: 'user', content: null },
      { role: 'user', content: 'Valid message' }
    ];
    expect(guessTitle(messages)).toBe('Valid message');
  });
});

describe('groupToolPairs', () => {
  it('should pair tool-use with tool-result by id', () => {
    const events = [
      { kind: 'tool-use', id: 'tool1', name: 'Read' },
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'result' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(1);
    expect(result[0].use.id).toBe('tool1');
    expect(result[0].result?.tool_call_id).toBe('tool1');
  });

  it('should handle multiple tool pairs', () => {
    const events = [
      { kind: 'tool-use', id: 'tool1', name: 'Read' },
      { kind: 'tool-use', id: 'tool2', name: 'Write' },
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'result1' },
      { kind: 'tool-result', tool_call_id: 'tool2', output: 'result2' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(2);
    expect(result[0].use.id).toBe('tool1');
    expect(result[0].result?.output).toBe('result1');
    expect(result[1].use.id).toBe('tool2');
    expect(result[1].result?.output).toBe('result2');
  });

  it('should handle orphaned tool-use (no matching result)', () => {
    const events = [
      { kind: 'tool-use', id: 'tool1', name: 'Read' },
      { kind: 'tool-use', id: 'tool2', name: 'Write' },
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'result1' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(2);
    expect(result[0].use.id).toBe('tool1');
    expect(result[0].result).toBeDefined();
    expect(result[1].use.id).toBe('tool2');
    expect(result[1].result).toBeUndefined();
  });

  it('should handle tool_call_id that includes the use id', () => {
    const events = [
      { kind: 'tool-use', id: 'abc', name: 'Read' },
      { kind: 'tool-result', tool_call_id: 'prefix-abc-suffix', output: 'result' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(1);
    expect(result[0].result).toBeDefined();
    expect(result[0].result?.output).toBe('result');
  });

  it('should ignore non-tool events', () => {
    const events = [
      { kind: 'user', text: 'Hello' },
      { kind: 'tool-use', id: 'tool1', name: 'Read' },
      { kind: 'assistant', text: 'Response' },
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'result' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(1);
    expect(result[0].use.id).toBe('tool1');
  });

  it('should handle empty events array', () => {
    const result = groupToolPairs([]);
    expect(result).toHaveLength(0);
  });

  it('should handle events with only tool-use (no results)', () => {
    const events = [
      { kind: 'tool-use', id: 'tool1', name: 'Read' },
      { kind: 'tool-use', id: 'tool2', name: 'Write' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(2);
    expect(result[0].result).toBeUndefined();
    expect(result[1].result).toBeUndefined();
  });

  it('should handle events with only tool-result (no uses)', () => {
    const events = [
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'orphaned' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(0);
  });

  it('should match first result when multiple results have same tool_call_id', () => {
    const events = [
      { kind: 'tool-use', id: 'tool1', name: 'Read' },
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'first' },
      { kind: 'tool-result', tool_call_id: 'tool1', output: 'second' }
    ];

    const result = groupToolPairs(events);

    expect(result).toHaveLength(1);
    expect(result[0].result?.output).toBe('first');
  });
});

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'conditional', 'always')).toBe('base always');
    expect(cn('base', true && 'conditional')).toBe('base conditional');
  });

  it('should merge Tailwind classes correctly', () => {
    // twMerge should deduplicate and resolve conflicts
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('should handle objects', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('should handle mixed inputs', () => {
    expect(cn(
      'base',
      ['array1', 'array2'],
      { conditional: true, skip: false },
      'final'
    )).toBe('base array1 array2 conditional final');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });
});
