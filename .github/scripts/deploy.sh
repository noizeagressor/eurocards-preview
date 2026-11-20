#!/usr/bin/env bash
set -euo pipefail
umask 077

mode=${DEPLOY_OPERATION:-deploy}
[[ "$GITHUB_REF" == refs/heads/main ]]
case "$mode" in
  deploy|rollback|bootstrap) ;;
  *) echo 'Unsupported operation' >&2; exit 1 ;;
esac

ssh_dir="$(mktemp -d "$RUNNER_TEMP/eurocards-ssh.XXXXXXXX")"
trap 'rm -f "$ssh_dir/key" "$ssh_dir/known_hosts"; rmdir "$ssh_dir"' EXIT
printf '%s\n' "${EUROCARDS_DEPLOY_KEY:?Missing EUROCARDS_DEPLOY_KEY}" > "$ssh_dir/key"
unset EUROCARDS_DEPLOY_KEY
host=57.129.189.244
ssh-keyscan -T 10 -p 22 -t ed25519 "$host" > "$ssh_dir/known_hosts"
fingerprint="$(ssh-keygen -E sha256 -lf "$ssh_dir/known_hosts" | awk '{print $2}')"
[[ "$fingerprint" == 'SHA256:+bvAQo3H43y6AaLdjn6gHkrRl7XoqTW4YQX7dDsJKWY' ]] || {
  echo 'Unexpected OVH SSH host key' >&2
  exit 1
}
remote() {
  ssh -F /dev/null -T -p 22 -i "$ssh_dir/key" -o IdentitiesOnly=yes \
    -o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
    -o StrictHostKeyChecking=yes -o HostKeyAlgorithms=ssh-ed25519 \
    -o UserKnownHostsFile="$ssh_dir/known_hosts" -o GlobalKnownHostsFile=/dev/null \
    "eurocards-deploy@$host" "$@"
}

live="$(remote status)"
before="$(jq -er '.revision // "none"' <<< "$live")"
if [[ "$mode" == rollback ]]; then
  [[ "${EXPECTED_REVISION:-}" =~ ^[0-9a-f]{40}$ && "$EXPECTED_REVISION" == "$before" ]] || {
    echo 'The requested rollback revision must match the active release' >&2
    exit 1
  }
  previous="$(jq -er '.previous | select(test("^[0-9a-f]{40}$"))' <<< "$live")"
  rolled="$(remote "rollback $before")"
  jq -e --arg previous "$previous" '.revision == $previous' <<< "$rolled" >/dev/null
  printf 'Restored release `%s`.\n' "$previous" >> "$GITHUB_STEP_SUMMARY"
  python3 -B .github/scripts/verify.py "$previous"
  exit 0
fi

tip="$(git ls-remote "https://github.com/$GITHUB_REPOSITORY.git" refs/heads/main | cut -f1)"
[[ "$tip" == "$GITHUB_SHA" ]] || { echo 'main advanced; skip the superseded release' >&2; exit 1; }

restore_previous() {
  if [[ "$before" != "none" && "$before" != "$GITHUB_SHA" ]]; then
    echo "Checking rollback of $GITHUB_SHA to $before"
    restored="$(remote "rollback $GITHUB_SHA")" || return 1
    jq -e --arg before "$before" '.revision == $before' <<< "$restored" >/dev/null || return 1
    printf 'Active OVH release after rollback check: `%s`.\n' "$before" >> "$GITHUB_STEP_SUMMARY"
    python3 -B .github/scripts/verify.py "$before"
  fi
}

if ! remote "deploy $GITHUB_SHA" < "$RUNNER_TEMP/eurocards.tar.gz"; then
  restore_previous
  exit 1
fi
if [[ "$mode" == bootstrap ]]; then
  remote status | jq -e --arg sha "$GITHUB_SHA" '.revision == $sha'
  printf 'Bootstrap `%s`: OVH loopback virtual host checked by the dispatcher. External DNS, TLS and Beget CDN were not tested.\n' "$GITHUB_SHA" >> "$GITHUB_STEP_SUMMARY"
elif ! python3 -B .github/scripts/verify.py "$GITHUB_SHA"; then
  restore_previous
  exit 1
fi
