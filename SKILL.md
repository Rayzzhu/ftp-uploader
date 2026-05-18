---
name: ftp-uploader
description: Upload local files or folders to remote servers via SFTP from natural language. Use when the user wants to upload, deploy, sync, or push files to a server, mentions SFTP/FTP, or gives paths like "upload dist to /data/app".
---

# FTP Uploader

## Run

From the skill package directory:

```bash
node dist/index.js "<natural language command>" --host <host> [--port 22]
```

Or after `npm link`:

```bash
ftp-uploader "<command>" --host <host>
```

## Examples

- `把 dist 文件夹传到服务器的 /data/app 目录下`
- `upload ./build to /var/www/html on server`

## Credentials

- Stored in `.claude-memory.json` (gitignored), keyed by host.
- First run prompts for username/password; optional save.
- Passwords are never printed in logs.

## Agent workflow

1. Confirm local path exists.
2. Run CLI with user text and `--host`.
3. If credentials missing, relay prompts to user and re-run.
4. Report upload result and audit log path `upload-audit.log`.
