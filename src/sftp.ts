import { stat } from "node:fs/promises";
import { basename, posix } from "node:path";
import SftpClient from "ssh2-sftp-client";
import type { ParsedUploadIntent, ServerCredentials } from "./types.js";

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
    if (localStat.isDirectory()) {
      const remoteBase = posix.join(intent.remotePath, basename(intent.localPath));
      await sftp.uploadDir(intent.localPath, remoteBase);
      uploaded.push(`${intent.localPath} -> ${remoteBase}/`);
    } else if (localStat.isFile()) {
      const remoteFile = posix.join(intent.remotePath, basename(intent.localPath));
      await ensureRemoteDir(sftp, intent.remotePath);
      await sftp.put(intent.localPath, remoteFile);
      uploaded.push(`${intent.localPath} -> ${remoteFile}`);
    } else {
      throw new Error(`Unsupported local path type: ${intent.localPath}`);
    }
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
