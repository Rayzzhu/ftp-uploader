export interface ServerCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface ParsedUploadIntent {
  localPath: string;
  remotePath: string;
}

export interface MemoryStore {
  servers: Record<string, Omit<ServerCredentials, "host"> & { host?: string }>;
}

export interface CliOptions {
  host: string;
  port: number;
  input: string;
  memoryPath: string;
  auditPath: string;
  cwd: string;
}
