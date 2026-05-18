import { resolve } from "node:path";
import type { ParsedUploadIntent } from "./types.js";

const UPLOAD_VERBS =
  /(?:上传|传到|传输|同步|部署|upload|push|send|transfer|sync|deploy)/i;

export function parseUploadIntent(input: string, cwd: string): ParsedUploadIntent {
  const text = input.trim();
  if (!text) {
    throw new Error("Empty input. Example: upload dist to /data/app");
  }

  const local = extractLocalPath(text, cwd);
  const remote = extractRemotePath(text);
  if (!local || !remote) {
    throw new Error(
      `Cannot parse paths from: "${text}". Need local path and remote directory.`
    );
  }

  return { localPath: local, remotePath: normalizeRemotePath(remote) };
}

function extractLocalPath(text: string, cwd: string): string | null {
  const quoted = text.match(/["']([^"']+)["']/);
  if (quoted?.[1]) {
    return resolve(cwd, quoted[1]);
  }

  const cn = text.match(
    /(?:把|将)?\s*([./\w-]+(?:\.\w+)?)\s*(?:文件夹|目录|文件)?\s*(?:上传|传到|传输|同步|部署)/i
  );
  if (cn?.[1]) {
    return resolve(cwd, cn[1]);
  }

  const en = text.match(
    /(?:upload|push|send|transfer|sync|deploy)\s+([./\w-]+(?:\.\w+)?)/i
  );
  if (en?.[1]) {
    return resolve(cwd, en[1]);
  }

  const pathLike = text.match(/(?:^|\s)([./][\w./-]+|[\w-]+(?:\.\w+)?)(?:\s|$)/);
  if (pathLike?.[1] && !pathLike[1].startsWith("/")) {
    return resolve(cwd, pathLike[1]);
  }

  return null;
}

function extractRemotePath(text: string): string | null {
  const unix = text.match(/(?:到|to|into|on)\s*(?:服务器)?\s*(\/[\w./_-]*)/i);
  if (unix?.[1]) {
    return unix[1];
  }

  const serverDir = text.match(
    /(?:服务器|server|remote)\s*(?:的|上)?\s*(\/[\w./_-]+)/i
  );
  if (serverDir?.[1]) {
    return serverDir[1];
  }

  const trailing = text.match(/(\/[\w./_-]+)\s*(?:目录|文件夹|下)?\s*$/i);
  if (trailing?.[1]) {
    return trailing[1];
  }

  return null;
}

function normalizeRemotePath(remote: string): string {
  let p = remote.replace(/\\/g, "/");
  if (!p.startsWith("/")) {
    p = "/" + p;
  }
  return p.replace(/\/+$/, "") || "/";
}

export function looksLikeUploadCommand(input: string): boolean {
  return UPLOAD_VERBS.test(input) || /\/[\w./_-]+/.test(input);
}
