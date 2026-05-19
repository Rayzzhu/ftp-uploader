import type { Stats } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, posix } from "node:path";
import SftpClient from "ssh2-sftp-client";
import type { ParsedUploadIntent, ServerCredentials } from "./types.js";

type LocalUploadStrategy = {
  match: (localStat: Stats) => boolean;
  upload: (sftp: SftpClient, intent: ParsedUploadIntent) => Promise<string>;
};

const localUploadStrategies: LocalUploadStrategy[] = [
  {
    match: (localStat) => localStat.isDirectory(),
    upload: async (sftp, intent) => {
      const remoteBase = posix.join(intent.remotePath, basename(intent.localPath));
      await sftp.uploadDir(intent.localPath, remoteBase);
      return `${intent.localPath} -> ${remoteBase}/`;
    },
  },
  {
    match: (localStat) => localStat.isFile(),
    upload: async (sftp, intent) => {
      const remoteFile = posix.join(intent.remotePath, basename(intent.localPath));
      await ensureRemoteDir(sftp, intent.remotePath);
      await sftp.put(intent.localPath, remoteFile);
      return `${intent.localPath} -> ${remoteFile}`;
    },
  },
];

export async function uploadToServer(
  creds: ServerCredentials,
  intent: ParsedUploadIntent
): Promise<string[]> {
  const sftp = new SftpClient();
  const uploaded: string[] = [];

  try {
    await sftp.connect({
      host: creds.host,
      port: creds.port,
      username: creds.username,
      password: creds.password,
      readyTimeout: 20000,
    });

    const localStat = await stat(intent.localPath);
    const strategy = localUploadStrategies.find((s) => s.match(localStat));
    if (!strategy) {
      throw new Error(`Unsupported local path type: ${intent.localPath}`);
    }
    uploaded.push(await strategy.upload(sftp, intent));
  } finally {
    await sftp.end().catch(() => undefined);
  }

  return uploaded;
}

async function ensureRemoteDir(sftp: SftpClient, remoteDir: string): Promise<void> {
  const parts = remoteDir.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    try {
      await sftp.mkdir(current, true);
    } catch {
      // directory may already exist
    }
  }
}
