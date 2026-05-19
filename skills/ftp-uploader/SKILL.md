---
name: ftp-uploader
description: Upload local files or folders to remote servers via SFTP from natural language. Use when the user wants to upload, deploy, sync, or push files to a server, mentions SFTP/FTP, or gives paths like "upload dist to /data/app".
metadata:
  author: Rayzzhu
  version: "1.0.0"
---

# FTP Uploader

Upload local files or directories to a remote server over SFTP using natural-language commands.

## When to Use

- User asks to upload, deploy, sync, or push files to a server
- User mentions SFTP, FTP, or remote paths like `/var/www` or `/data/app`
- User gives commands such as `把 dist 传到服务器 /data/app`

## Prerequisites

- Node.js 18+
- Network access to the target host and port (default SFTP port 22)

## Run the CLI

From the project root (preferred — uses this repo if present):

```bash
bash skills/ftp-uploader/scripts/upload.sh "<natural language>" --host <host> [--port 22]
```

After `npx skills add` (skill installed under `.agents/skills/` or `~/.cursor/skills/`):

```bash
bash scripts/upload.sh "<natural language>" --host <host> [--port 22]
```

Or via npm / npx (no local clone):

```bash
npx --yes github:Rayzzhu/ftp-uploader "<natural language>" --host <host> [--port 22]
```

## Examples

- `把 dist 文件夹传到服务器的 /data/app 目录下`
- `upload ./build to /var/www/html on server`

## Credentials

- Stored in `.claude-memory.json` in the **current working directory** (gitignored), keyed by host
- First run prompts for username/password; user may save for reuse
- Never print passwords in chat or logs

## Agent Workflow

1. Confirm the local path exists in the user's project
2. Obtain `--host` (and `--port` if not 22) from the user
3. Run `scripts/upload.sh` with the user's natural-language command
4. If credentials are missing, relay prompts to the user and re-run
5. Report each `OK` line and the audit log path `upload-audit.log`

## Local Docker Test (optional)

```bash
bash skills/ftp-uploader/scripts/docker-up.sh
mkdir -p test-upload && echo hello > test-upload/hello.txt
bash skills/ftp-uploader/scripts/upload.sh "upload test-upload to /home/testuser/upload" --host 127.0.0.1 --port 2222
```

Default test account: `testuser` / `testpass`. See `references/docker-test.md`.
