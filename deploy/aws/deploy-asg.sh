#!/usr/bin/env bash
set -euo pipefail

: "${AWS_BUCKET:?Falta AWS_BUCKET}"
: "${AWS_ASG_NAME:?Falta AWS_ASG_NAME}"
group=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$AWS_ASG_NAME" \
  --query 'AutoScalingGroups[0]' --output json)

# Una sola instancia puede escribir en esta base SQLite.
instance=$(jq -er '
  select(.DesiredCapacity == 1 and (.Instances | length) == 1)
  | .Instances[0] | select(.LifecycleState == "InService" and .HealthStatus == "Healthy")
  | .InstanceId' <<< "$group") || {
  echo "::error::Se necesita una sola instancia en servicio para desplegar con SQLite."
  exit 1
}

release="$GITHUB_SHA-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
prefix="s3://$AWS_BUCKET/releases/$release"
aws s3 cp "$RUNNER_TEMP/kordex.tar.gz" "$prefix/kordex.tar.gz"
aws s3 cp deploy/aws/install-release.sh "$prefix/install-release.sh"

printf -v remote 'set -eu; tmp=$(mktemp); trap '\''rm -f "$tmp"'\'' EXIT; aws s3 cp %q "$tmp"; bash "$tmp" %q %q' \
  "$prefix/install-release.sh" "$AWS_BUCKET" "$release"
parameters=$(jq -nc --arg command "$remote" '{commands:[$command],executionTimeout:["600"]}')
command_id=$(aws ssm send-command --document-name AWS-RunShellScript --instance-ids "$instance" \
  --parameters "$parameters" --query 'Command.CommandId' --output text)

# En Run Command la invocación puede tardar en hacerse visible.
for ((attempt=1; attempt<=65; attempt++)); do
  if result=$(aws ssm get-command-invocation --instance-id "$instance" --command-id "$command_id" --output json 2>&1); then
    status=$(jq -er '.Status' <<< "$result")
    case "$status" in
      Success|Failed|Cancelled|TimedOut)
        jq -r '.StandardOutputContent,.StandardErrorContent' <<< "$result"
        [[ "$status" == Success ]]
        exit ;;
    esac
  elif [[ "$result" != *InvocationDoesNotExist* ]]; then
    printf '%s\n' "$result" >&2
    exit 1
  fi
  sleep 10
done
echo "::error::No se obtuvo el resultado de Run Command $command_id a tiempo."
exit 1
