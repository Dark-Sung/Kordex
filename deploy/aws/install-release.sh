#!/usr/bin/env bash
set -euo pipefail

bucket="${1:?Indica el bucket}"
release="${2:?Indica la versión}"
[[ "$release" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]]
root=/opt/kordex
data=/var/lib/kordex
mountpoint -q "$data" || { echo "El volumen EBS debe estar montado en $data." >&2; exit 1; }
mkdir -p "$root/releases"
exec 9>"$root/install.lock"
flock 9
stage=$(mktemp -d "$root/releases/.stage.XXXXXX")
trap 'rm -rf -- "$stage"' EXIT
old=$(readlink "$root/current" || true)
target="$root/releases/$release"

if [[ ! -d "$target" ]]; then
  aws s3 cp "s3://$bucket/releases/$release/kordex.tar.gz" "$stage/app.tar.gz"
  mkdir "$stage/app"
  tar -xzf "$stage/app.tar.gz" -C "$stage/app"
  test -f "$stage/app/server.js"
  mv "$stage/app" "$target"
fi

switch_to() {
  ln -sfn "$1" "$stage/current"
  mv -Tf "$stage/current" "$root/current"
}

systemctl stop kordex
if [[ -f "$data/inventario.db" ]]; then
  if ! tar -C "$data" -czf "$stage/datos.tar.gz" . ||
     ! aws s3 cp "$stage/datos.tar.gz" "s3://$bucket/backups/$(date -u +%Y%m%dT%H%M%S)-$release.tar.gz"; then
    if [[ -n "$old" ]]; then systemctl start kordex; fi
    exit 1
  fi
fi

if switch_to "$target" && systemctl start kordex &&
   curl --fail --silent --show-error --retry 15 --retry-connrefused --retry-delay 1 \
     --max-time 4 http://127.0.0.1:3000/iniciar-sesion >/dev/null &&
   printf '%s\n' "$release" > "$stage/current.txt" &&
   aws s3 cp "$stage/current.txt" "s3://$bucket/releases/current.txt"; then
  exit 0
fi

systemctl stop kordex
if [[ -n "$old" ]]; then
  switch_to "$old"
  systemctl start kordex
else
  rm -f "$root/current"
fi
exit 1
