# Docker SFTP test

From the repository root:

```bash
npm run docker:up
mkdir -p test-upload && echo hello > test-upload/hello.txt
npm run build
bash skills/ftp-uploader/scripts/upload.sh "upload test-upload to /home/testuser/upload" --host 127.0.0.1 --port 2222
docker exec ftp-uploader-sftp-test ls -la /home/testuser/upload
npm run docker:down
```
