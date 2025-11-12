// Test script to verify Claude format parsing
import { readFileSync } from 'fs';
import { parseJsonl } from './src/lib/parser.ts';

const filePath = process.argv[2] || './claude-test.jsonl';

console.log(`Testing parser with: ${filePath}\n`);

try {
  const content = readFileSync(filePath, 'utf8');
  const result = parseJsonl(content);

  console.log(`Title: ${result.title}`);
  console.log(`Total events: ${result.events.length}`);
  console.log(`Original messages: ${result.originalMessages.length}\n`);

  console.log('Event breakdown:');
  const counts = {};
  result.events.forEach(e => {
    counts[e.kind] = (counts[e.kind] || 0) + 1;
  });
  Object.entries(counts).forEach(([kind, count]) => {
    console.log(`  ${kind}: ${count}`);
  });

  console.log('\nFirst 5 events:');
  result.events.slice(0, 5).forEach((e, i) => {
    const preview = e.text ? e.text.slice(0, 60) : e.name || e.kind;
    console.log(`  ${i + 1}. [${e.kind}] ${preview}${e.text?.length > 60 ? '...' : ''}`);
  });

  console.log('\n✅ Parsing successful!');
} catch (error) {
  console.error('❌ Parsing failed:', error.message);
  process.exit(1);
}
