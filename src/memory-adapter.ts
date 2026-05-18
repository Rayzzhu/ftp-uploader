import type { ServerCredentials } from "./types.js";

export interface MemoryAdapter {
  load(host: string, port: number): Promise<ServerCredentials | null>;
  save(creds: ServerCredentials): Promise<void>;
  promptAndMaybeSave(host: string, port: number): Promise<ServerCredentials>;
  clearRuntimeCache(): void;
}
