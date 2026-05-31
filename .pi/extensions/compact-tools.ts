/**
 * Compact Tools — Compacts tool input to cmd + first arg, hides all output.
 *
 * Overrides built-in tools (read, bash, edit, write, find, grep, ls) so TUI
 * shows only the tool name + key argument. All output is hidden — collapsed
 * and expanded views show nothing.
 *
 * Usage: place in .pi/extensions/ (auto-discovered on /reload)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  createBashTool,
  createEditTool,
  createFindTool,
  createGrepTool,
  createLsTool,
  createReadTool,
  createWriteTool,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

// --- Helpers ---

function shorten(path: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const p = path.replace(/\\/g, "/");
  if (p.startsWith(cwd + "/")) return p.slice(cwd.length + 1);
  return path;
}

const cache = new Map<string, ReturnType<typeof makeTools>>();

function makeTools(cwd: string) {
  return {
    read: createReadTool(cwd),
    bash: createBashTool(cwd),
    edit: createEditTool(cwd),
    write: createWriteTool(cwd),
    find: createFindTool(cwd),
    grep: createGrepTool(cwd),
    ls: createLsTool(cwd),
  };
}

function getTools(cwd: string) {
  let t = cache.get(cwd);
  if (!t) {
    t = makeTools(cwd);
    cache.set(cwd, t);
  }
  return t;
}

// --- Extension ---

export default function (pi: ExtensionAPI) {
  // ---- read ----
  const r = getTools(process.cwd()).read;
  pi.registerTool({
    name: "read",
    label: "read",
    description: r.description,
    parameters: r.parameters,
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).read.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const p = shorten(args.path || "");
      return new Text(theme.fg("toolTitle", theme.bold("read ")) + theme.fg("accent", p), 0, 0);
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });

  // ---- bash ----
  const b = getTools(process.cwd()).bash;
  pi.registerTool({
    name: "bash",
    label: "bash",
    description: b.description,
    parameters: b.parameters,
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).bash.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const cmd = args.command || "";
      const short = cmd.length > 120 ? cmd.slice(0, 117) + "..." : cmd;
      return new Text(theme.fg("toolTitle", theme.bold("$ ")) + theme.fg("accent", short), 0, 0);
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });

  // ---- edit ----
  const e = getTools(process.cwd()).edit;
  pi.registerTool({
    name: "edit",
    label: "edit",
    description: e.description,
    parameters: e.parameters,
    renderShell: "self",
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).edit.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const p = shorten(args.path || "");
      return new Text(theme.fg("toolTitle", theme.bold("edit ")) + theme.fg("accent", p), 0, 0);
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });

  // ---- write ----
  const w = getTools(process.cwd()).write;
  pi.registerTool({
    name: "write",
    label: "write",
    description: w.description,
    parameters: w.parameters,
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).write.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const p = shorten(args.path || "");
      return new Text(theme.fg("toolTitle", theme.bold("write ")) + theme.fg("accent", p), 0, 0);
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });

  // ---- find ----
  const f = getTools(process.cwd()).find;
  pi.registerTool({
    name: "find",
    label: "find",
    description: f.description,
    parameters: f.parameters,
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).find.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const pat = args.pattern || "*";
      const p = shorten(args.path || ".");
      return new Text(
        theme.fg("toolTitle", theme.bold("find ")) +
          theme.fg("accent", pat) +
          theme.fg("dim", " in " + p),
        0,
        0,
      );
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });

  // ---- grep ----
  const g = getTools(process.cwd()).grep;
  pi.registerTool({
    name: "grep",
    label: "grep",
    description: g.description,
    parameters: g.parameters,
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).grep.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const pat = args.pattern || "";
      const p = shorten(args.path || ".");
      return new Text(
        theme.fg("toolTitle", theme.bold("grep ")) +
          theme.fg("accent", "/" + pat + "/") +
          theme.fg("dim", " in " + p),
        0,
        0,
      );
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });

  // ---- ls ----
  const l = getTools(process.cwd()).ls;
  pi.registerTool({
    name: "ls",
    label: "ls",
    description: l.description,
    parameters: l.parameters,
    async execute(id, args, signal, update, ctx) {
      return getTools(ctx.cwd).ls.execute(id, args, signal, update);
    },
    renderCall(args, theme) {
      const p = shorten(args.path || ".");
      return new Text(theme.fg("toolTitle", theme.bold("ls ")) + theme.fg("accent", p), 0, 0);
    },
    renderResult() {
      return new Text("", 0, 0);
    },
  });
}
