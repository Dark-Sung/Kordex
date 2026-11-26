#!/bin/bash
set -euo pipefail

# Sustituye este nombre antes de pegar el script en la plantilla EC2.
BUCKET="NOMBRE-DEL-BUCKET"
REGION="us-east-1"
[[ "$BUCKET" != "NOMBRE-DEL-BUCKET" ]]

dnf -y install nodejs22 cronie
id kordex >/dev/null 2>&1 || useradd --system --user-group --shell /sbin/nologin kordex
install -d /opt/kordex/releases /var/lib/kordex
printf 'BUCKET=%q\nREGION=%q\n' "$BUCKET" "$REGION" >/etc/kordex-deploy.conf

cat >/etc/systemd/system/kordex.service <<'UNIT'
[Unit]
Description=Kordex
After=network-online.target
Wants=network-online.target
RequiresMountsFor=/var/lib/kordex
ConditionPathIsMountPoint=/var/lib/kordex

[Service]
User=kordex
Group=kordex
WorkingDirectory=/opt/kordex/current
Environment=NODE_ENV=production
Environment=HOSTNAME=0.0.0.0
Environment=PORT=3000
Environment=DATA_DIR=/var/lib/kordex
ExecStart=/usr/bin/node-22 server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
UNIT

cat >/usr/local/sbin/kordex-sync <<'SYNC'
#!/bin/bash
set -euo pipefail
source /etc/kordex-deploy.conf
root=/opt/kordex
data=/var/lib/kordex
mountpoint -q "$data" || { echo "Monta EBS en $data" >&2; exit 1; }
exec 9>"$root/sync.lock"
flock -n 9 || exit 0
release=$(aws s3 cp "s3://$BUCKET/releases/current.txt" - --region "$REGION" --only-show-errors)
[[ "$release" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]]
target="$root/releases/$release"
current=$(readlink "$root/current" || true)
[[ "$target" != "$current" ]] || exit 0

stage=$(mktemp -d "$root/releases/.stage.XXXXXX")
trap 'rm -rf -- "$stage"' EXIT
if [[ ! -d "$target" ]]; then
  aws s3 cp "s3://$BUCKET/releases/$release.tar.gz" "$stage/app.tar.gz" --region "$REGION" --only-show-errors
  mkdir "$stage/app"
  tar --no-same-owner -xzf "$stage/app.tar.gz" -C "$stage/app"
  test -f "$stage/app/server.js"
  install -d -o kordex -g kordex "$stage/app/.next/cache"
  mv "$stage/app" "$target"
fi

switch_to() {
  ln -s "$1" "$stage/current"
  mv -Tf "$stage/current" "$root/current"
}

chown kordex:kordex "$data"
if switch_to "$target" && systemctl restart kordex &&
   curl -fsS --retry 12 --retry-connrefused --retry-delay 1 --max-time 5 \
     http://127.0.0.1:3000/health.html >/dev/null; then
  exit 0
fi

systemctl stop kordex
if [[ -n "$current" ]]; then
  switch_to "$current"
  systemctl start kordex
else
  rm -f "$root/current"
fi
exit 1
SYNC

chmod 0755 /usr/local/sbin/kordex-sync
systemctl daemon-reload
systemctl enable kordex
printf '* * * * * root /usr/local/sbin/kordex-sync >>/var/log/kordex-sync.log 2>&1\n' >/etc/cron.d/kordex-sync
systemctl enable --now crond
/usr/local/sbin/kordex-sync
