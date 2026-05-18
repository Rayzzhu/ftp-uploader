import { appendFile } from "node:fs/promises";
import { homedir, userInfo } from "node:os";
import type { ServerCredentials } from "./types.js";

export function maskPassword(password: string): string {
  return password ? "*******" : "";
}

export function formatConnectionInfo(creds: ServerCredentials): string {
  return `host=${creds.host} port=${creds.port} user=${creds.username} password=${maskPassword(creds.password)}`;
}

export async function appendAuditLog(
  auditPath: string,
  entry: { action: string; localPath: string; remotePath: string; host: string }
): Promise<void> {
  const user = userInfo().username;
  const line = JSON.stringify({
    time: new Date().toISOString(),
    user,
    ...entry,
  });
  await appendFile(auditPath, line + "\n", "utf8");
}

export function resolveDefaultMemoryPath(cwd: string): string {
  return `${cwd}/.claude-memory.json`;
}

export function resolveDefaultAuditPath(cwd: string): string {
  return `${cwd}/upload-audit.log`;
}

export function getProcessUserLabel(): string {
  try {
    return userInfo().username;
  } catch {
    return homedir().split(/[/\\]/).pop() ?? "unknown";
  }
}
