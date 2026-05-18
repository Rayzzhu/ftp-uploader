#!/usr/bin/env node
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { FileMemoryAdapter } from "./memory.js";
import { parseUploadIntent } from "./parser.js";
import { uploadToServer } from "./sftp.js";
import type { CliOptions, ServerCredentials } from "./types.js";
import {
  appendAuditLog,
  formatConnectionInfo,
  resolveDefaultAuditPath,
  resolveDefaultMemoryPath,
} from "./utils.js";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const intent = parseUploadIntent(options.input, options.cwd);

  await access(intent.localPath, constants.R_OK).catch(() => {
    throw new Error(`Local path not found or not readable: ${intent.localPath}`);
  });

  const memory = new FileMemoryAdapter(options.memoryPath);
  let creds = await memory.load(options.host, options.port);

  if (!creds) {
    console.log(`No credentials found for ${options.host}:${options.port}`);
    creds = await memory.promptAndMaybeSave(options.host, options.port);
  }

  console.log(`Connecting: ${formatConnectionInfo(creds)}`);
  console.log(`Upload: ${intent.localPath} -> ${intent.remotePath}`);

  try {
    const results = await uploadToServer(creds, intent);
    for (const line of results) {
      console.log(`OK ${line}`);
    }
    await appendAuditLog(options.auditPath, {
      action: "upload",
      localPath: intent.localPath,
      remotePath: intent.remotePath,
      host: options.host,
    });
    console.log(`Audit log: ${options.auditPath}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/auth|password|denied|login/i.test(message)) {
      throw new Error(`Authentication failed for ${options.host}: ${message}`);
    }
    throw err;
  } finally {
    memory.clearRuntimeCache();
  }
}

function parseArgs(argv: string[]): CliOptions {
  const cwd = process.cwd();
  let host = "";
  let port = 22;
  let memoryPath = resolveDefaultMemoryPath(cwd);
  let auditPath = resolveDefaultAuditPath(cwd);
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--host" && argv[i + 1]) {
      host = argv[++i];
    } else if (arg === "--port" && argv[i + 1]) {
      port = Number(argv[++i]);
    } else if (arg === "--memory" && argv[i + 1]) {
      memoryPath = resolve(cwd, argv[++i]);
    } else if (arg === "--audit" && argv[i + 1]) {
      auditPath = resolve(cwd, argv[++i]);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (!host) {
    throw new Error("--host is required. Example: ftp-uploader \"upload dist to /data/app\" --host 192.168.1.10");
  }
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid --port value");
  }

  const inputText = positional.join(" ").trim();
  if (!inputText) {
    throw new Error("Natural language command is required as the first argument.");
  }

  return { host, port, input: inputText, memoryPath, auditPath, cwd };
}

function printHelp(): void {
  console.log(`Usage: ftp-uploader "<natural language>" --host <host> [--port 22]

Examples:
  ftp-uploader "把 dist 传到服务器 /data/app" --host example.com
  ftp-uploader "upload ./build to /var/www" --host 10.0.0.1 --port 22
`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
