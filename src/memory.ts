import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { MemoryAdapter } from "./memory-adapter.js";
import type { MemoryStore, ServerCredentials } from "./types.js";

export class FileMemoryAdapter implements MemoryAdapter {
  private runtimeCache: ServerCredentials | null = null;

  constructor(private readonly memoryPath: string) {}

  async load(host: string, port: number): Promise<ServerCredentials | null> {
    if (this.runtimeCache?.host === host && this.runtimeCache.port === port) {
      return { ...this.runtimeCache };
    }

    const store = await this.readStore();
    const key = serverKey(host, port);
    const entry = store.servers[key];
    if (!entry?.username || !entry?.password) {
      return null;
    }

    const creds: ServerCredentials = {
      host,
      port,
      username: entry.username,
      password: entry.password,
    };
    this.runtimeCache = creds;
    return { ...creds };
  }

  async save(creds: ServerCredentials): Promise<void> {
    const store = await this.readStore();
    const key = serverKey(creds.host, creds.port);
    store.servers[key] = {
      username: creds.username,
      password: creds.password,
      port: creds.port,
    };
    await writeFile(this.memoryPath, JSON.stringify(store, null, 2), "utf8");
    this.runtimeCache = { ...creds };
  }

  clearRuntimeCache(): void {
    this.runtimeCache = null;
  }

  async promptAndMaybeSave(host: string, port: number): Promise<ServerCredentials> {
    const username = (await askLine(`Username for ${host}:${port}: `)).trim();
    const password = await readHiddenPassword(`Password for ${host}:${port}: `);
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    const creds: ServerCredentials = { host, port, username, password };
    const saveAnswer = (await askLine("Save credentials to local memory? (y/N): "))
      .trim()
      .toLowerCase();
    if (saveAnswer === "y" || saveAnswer === "yes") {
      await this.save(creds);
      console.log(`Credentials saved to ${this.memoryPath}`);
    } else {
      this.runtimeCache = creds;
    }
    return creds;
  }

  private async readStore(): Promise<MemoryStore> {
    try {
      await access(this.memoryPath, constants.F_OK);
    } catch {
      return { servers: {} };
    }
    const raw = await readFile(this.memoryPath, "utf8");
    const parsed = JSON.parse(raw) as MemoryStore;
    if (!parsed.servers || typeof parsed.servers !== "object") {
      return { servers: {} };
    }
    return parsed;
  }
}

function serverKey(host: string, port: number): string {
  return `${host}:${port}`;
}

async function askLine(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
}

async function readHiddenPassword(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return (await askLine(prompt)).trim();
  }

  process.stdout.write(prompt);
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  let value = "";
  return await new Promise((resolve, reject) => {
    const onData = (chunk: string) => {
      switch (chunk) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value);
          break;
        case "\u0003":
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          reject(new Error("Cancelled"));
          break;
        case "\u007f":
        case "\b":
          value = value.slice(0, -1);
          break;
        default:
          if (chunk >= " " || chunk === "\t") {
            value += chunk;
          }
      }
    };
    stdin.on("data", onData);
  });
}
