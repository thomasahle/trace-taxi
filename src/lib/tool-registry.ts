
import type { ToolRenderContext } from './types';
import TerminalBlock from '../components/TerminalBlock.svelte';
import DiffBlock from '../components/DiffBlock.svelte';
import FileCard from '../components/FileCard.svelte';
import ToolUnknown from '../components/ToolUnknown.svelte';
import BashAdapter from '../components/BashAdapter.svelte';
import FileOperationsAdapter from '../components/FileOperationsAdapter.svelte';
import SearchAdapter from '../components/SearchAdapter.svelte';
import TodoAdapter from '../components/TodoAdapter.svelte';
import TaxiEstimateAdapter from '../components/TaxiEstimateAdapter.svelte';
import TaxiSearchAdapter from '../components/TaxiSearchAdapter.svelte';

export type ToolRenderer = {
  label?: (ctx: ToolRenderContext) => string;
  component: any; // SvelteComponent
};

// A simple global registry.
const registry = new Map<string, ToolRenderer>();

export function registerTool(name: string, renderer: ToolRenderer) {
  registry.set(name, renderer);
}

export function getTool(name: string): ToolRenderer {
  return registry.get(name) ?? { component: ToolUnknown };
}

// ---- Built-in renderers ----

// Claude's Bash tool
['Bash', 'bash', 'shell', 'sh', 'terminal', 'cmd', 'execute_command'].forEach(n => {
  registerTool(n, {
    component: BashAdapter,
    label: (ctx) => 'Bash'
  });
});

// Claude Code: BashOutput - check output of background bash
['BashOutput'].forEach(n => {
  registerTool(n, {
    component: BashAdapter,
    label: (ctx) => 'BashOutput'
  });
});

// Claude Code: KillShell - terminate background process
['KillShell'].forEach(n => {
  registerTool(n, {
    component: BashAdapter,
    label: (ctx) => 'KillShell'
  });
});

// File operations (Read/Write/Edit)
['Read', 'read', 'file.read', 'fs.read', 'file_read', 'open_file'].forEach(n => {
  registerTool(n, {
    component: FileOperationsAdapter,
    label: (ctx) => 'Read'
  });
});

['Write', 'write', 'file.write', 'fs.write', 'file_write', 'create_file'].forEach(n => {
  registerTool(n, {
    component: FileOperationsAdapter,
    label: (ctx) => 'Write'
  });
});

['Edit', 'edit', 'file.edit', 'fs.edit', 'file_edit', 'modify_file'].forEach(n => {
  registerTool(n, {
    component: FileOperationsAdapter,
    label: (ctx) => 'Edit'
  });
});

// Search operations (Grep/Glob)
['Grep', 'grep', 'search', 'find_in_files', 'search_content'].forEach(n => {
  registerTool(n, {
    component: SearchAdapter,
    label: (ctx) => 'Grep'
  });
});

['Glob', 'glob', 'find', 'find_files', 'search_files'].forEach(n => {
  registerTool(n, {
    component: SearchAdapter,
    label: (ctx) => 'Glob'
  });
});

// Todo management
['TodoWrite', 'todowrite', 'todo', 'checklist'].forEach(n => {
  registerTool(n, {
    component: TodoAdapter,
    label: (ctx) => 'TodoWrite'
  });
});

// Claude Code: Task - launch subagent
['Task'].forEach(n => {
  registerTool(n, {
    component: ToolUnknown,
    label: (ctx) => 'Task'
  });
});

// Claude Code: Web operations
['WebFetch', 'webfetch'].forEach(n => {
  registerTool(n, {
    component: ToolUnknown,
    label: (ctx) => 'WebFetch'
  });
});

['WebSearch', 'websearch'].forEach(n => {
  registerTool(n, {
    component: ToolUnknown,
    label: (ctx) => 'WebSearch'
  });
});

// Claude Code: Notebook editing
['NotebookEdit', 'notebookedit'].forEach(n => {
  registerTool(n, {
    component: FileOperationsAdapter,
    label: (ctx) => 'NotebookEdit'
  });
});

// Claude Code: User interaction
['AskUserQuestion', 'askuserquestion'].forEach(n => {
  registerTool(n, {
    component: ToolUnknown,
    label: (ctx) => 'AskUserQuestion'
  });
});

// Claude Code: Skills and slash commands
['Skill', 'skill'].forEach(n => {
  registerTool(n, {
    component: ToolUnknown,
    label: (ctx) => 'Skill'
  });
});

['SlashCommand', 'slashcommand'].forEach(n => {
  registerTool(n, {
    component: ToolUnknown,
    label: (ctx) => 'SlashCommand'
  });
});

// Legacy terminal renderer
['process.run', 'run_command'].forEach(n => {
  registerTool(n, {
    component: TerminalBlock
  });
});

// File view (legacy)
['file.show'].forEach(n => {
  registerTool(n, {
    component: FileCard
  });
});

// Diff tool
['file.diff', 'git.diff', 'patch.apply', 'code_diff'].forEach(n => {
  registerTool(n, {
    component: DiffBlock
  });
});

// Taxi tools
['get_taxi_estimate', 'getTaxiEstimate', 'taxi_estimate'].forEach(n => {
  registerTool(n, {
    component: TaxiEstimateAdapter,
    label: (ctx) => 'Get Taxi Estimate'
  });
});

['search_taxis', 'searchTaxis', 'find_taxis', 'taxi_search'].forEach(n => {
  registerTool(n, {
    component: TaxiSearchAdapter,
    label: (ctx) => 'Search Taxis'
  });
});

export function allRegisteredTools() {
  return Array.from(registry.keys());
}
