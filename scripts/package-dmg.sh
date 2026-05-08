#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
YARN_BIN="$ROOT_DIR/.yarn/releases/yarn-4.8.0.cjs"
DMG_DIR="$ROOT_DIR/target/release/bundle/dmg"

cd "$ROOT_DIR"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script can only build a macOS DMG on macOS."
  exit 1
fi

if [[ ! -f "$YARN_BIN" ]]; then
  echo "Cannot find Yarn at: $YARN_BIN"
  exit 1
fi

if [[ -d "$HOME/.cargo/bin" ]]; then
  export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "Building MarkFlowy DMG for $(uname -m)..."

echo "Rebuilding desktop frontend..."
rm -rf "$ROOT_DIR/apps/desktop/dist"
node "$YARN_BIN" workspace @markflowy/desktop build

node "$YARN_BIN" workspace @markflowy/desktop tauri build \
  --bundles app dmg \
  --config '{"bundle":{"createUpdaterArtifacts":false}}'

DMG_PATH="$(find "$DMG_DIR" -maxdepth 1 -name 'MarkFlowy_*_*.dmg' -type f -print | sort | tail -n 1)"

if [[ -z "$DMG_PATH" ]]; then
  echo "DMG was not found in: $DMG_DIR"
  exit 1
fi

echo "Verifying DMG..."
hdiutil verify "$DMG_PATH"

echo
echo "DMG package is ready:"
echo "$DMG_PATH"
