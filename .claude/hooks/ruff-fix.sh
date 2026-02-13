#!/bin/bash
# Hook: run ruff check --fix + ruff format on edited Python files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run on Python files
if [[ "$FILE_PATH" != *.py ]]; then
  exit 0
fi

# Only run if file exists (skip deletes)
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/backend" || exit 0

CHECK_OUTPUT=$(uv run ruff check --fix "$FILE_PATH" 2>&1)
FORMAT_OUTPUT=$(uv run ruff format "$FILE_PATH" 2>&1)

exit 0
