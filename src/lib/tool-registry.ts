
import type { ToolRenderContext } from './types';
import TerminalBlock from '../components/TerminalBlock.svelte';
import DiffBlock from '../components/DiffBlock.svelte';
import FileCard from '../components/FileCard.svelte';
import ToolUnknown from '../components/adapters/ToolUnknown.svelte';
import BashAdapter from '../components/adapters/BashAdapter.svelte';
import FileOperationsAdapter from '../components/adapters/FileOperationsAdapter.svelte';
import SearchAdapter from '../components/adapters/SearchAdapter.svelte';
import TodoAdapter from '../components/adapters/TodoAdapter.svelte';
import TaxiEstimateAdapter from '../components/adapters/TaxiEstimateAdapter.svelte';
import TaxiSearchAdapter from '../components/adapters/TaxiSearchAdapter.svelte';
import AskUserQuestionAdapter from '../components/adapters/AskUserQuestionAdapter.svelte';
import ExitPlanModeAdapter from '../components/adapters/ExitPlanModeAdapter.svelte';
import TaskAdapter from '../components/adapters/TaskAdapter.svelte';
import WebFetchAdapter from '../components/adapters/WebFetchAdapter.svelte';
import WebSearchAdapter from '../components/adapters/WebSearchAdapter.svelte';
import ChromeDevToolsAdapter from '../components/adapters/ChromeDevToolsAdapter.svelte';

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
    label: (ctx) => {
      const todos = ctx.event?.input?.todos || [];
      if (todos.length === 0) return 'Todo List';

      const completed = todos.filter((t: any) => t.status === 'completed').length;
      const inProgress = todos.filter((t: any) => t.status === 'in_progress').length;
      const pending = todos.filter((t: any) => t.status === 'pending').length;

      const parts = [];
      if (completed > 0) parts.push(`${completed} done`);
      if (inProgress > 0) parts.push(`${inProgress} active`);
      if (pending > 0) parts.push(`${pending} pending`);

      const status = parts.join(', ') || `${todos.length} tasks`;
      return `Todo List (${status})`;
    }
  });
});

// Claude Code: Task - launch subagent
['Task'].forEach(n => {
  registerTool(n, {
    component: TaskAdapter,
    label: (ctx) => 'Task'
  });
});

// Claude Code: Web operations
['WebFetch', 'webfetch'].forEach(n => {
  registerTool(n, {
    component: WebFetchAdapter,
    label: (ctx) => 'WebFetch'
  });
});

['WebSearch', 'websearch'].forEach(n => {
  registerTool(n, {
    component: WebSearchAdapter,
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
    component: AskUserQuestionAdapter,
    label: (ctx) => 'AskUserQuestion'
  });
});

// Claude Code: Plan mode
['ExitPlanMode', 'exitplanmode'].forEach(n => {
  registerTool(n, {
    component: ExitPlanModeAdapter,
    label: (ctx) => 'ExitPlanMode'
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

// Chrome DevTools MCP tools
const chromeDevToolsList = [
  'mcp__chrome-devtools__take_screenshot',
  'mcp__chrome-devtools__take_snapshot',
  'mcp__chrome-devtools__click',
  'mcp__chrome-devtools__fill',
  'mcp__chrome-devtools__fill_form',
  'mcp__chrome-devtools__hover',
  'mcp__chrome-devtools__press_key',
  'mcp__chrome-devtools__navigate_page',
  'mcp__chrome-devtools__new_page',
  'mcp__chrome-devtools__close_page',
  'mcp__chrome-devtools__select_page',
  'mcp__chrome-devtools__list_pages',
  'mcp__chrome-devtools__resize_page',
  'mcp__chrome-devtools__evaluate_script',
  'mcp__chrome-devtools__wait_for',
  'mcp__chrome-devtools__upload_file',
  'mcp__chrome-devtools__drag',
  'mcp__chrome-devtools__emulate',
  'mcp__chrome-devtools__handle_dialog',
  'mcp__chrome-devtools__list_console_messages',
  'mcp__chrome-devtools__get_console_message',
  'mcp__chrome-devtools__list_network_requests',
  'mcp__chrome-devtools__get_network_request',
  'mcp__chrome-devtools__performance_start_trace',
  'mcp__chrome-devtools__performance_stop_trace',
  'mcp__chrome-devtools__performance_analyze_insight'
];

chromeDevToolsList.forEach(n => {
  registerTool(n, {
    component: ChromeDevToolsAdapter,
    label: (ctx) => {
      // Clean up the name for display
      const cleanName = n.replace('mcp__chrome-devtools__', '').replace(/_/g, ' ');
      // Capitalize first letter of each word
      return cleanName.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  });
});

export function allRegisteredTools() {
  return Array.from(registry.keys());
}
