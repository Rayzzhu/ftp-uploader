ARG BASE_IMAGE=docker.1ms.run/library/alpine:3.20
FROM ${BASE_IMAGE}

RUN apk add --no-cache openssh openssh-sftp-server \
  && ssh-keygen -A \
  && adduser -D testuser \
  && echo "testuser:testpass" | chpasswd \
  && mkdir -p /home/testuser/upload \
  && chown testuser:testuser /home/testuser/upload \
  && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D", "-e"]
