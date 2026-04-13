#!/usr/bin/env bash

# steps that should be run periodically to update data, reports, etc.

# usage:
# ./run_pipeline.sh --some-script param1 param2
# runs script of same name in /data/package.json and /frontend/package.json if they exist

set -e

regex="--([A-Za-z0-9:-]+) *(.*)?$"

if [[ $* =~ $regex ]]; then
  script=${BASH_REMATCH[1]}
  params=${BASH_REMATCH[2]}

  echo "Running script: '$script'"
  echo "With params: '$params'"

  # install packages
  if [[ $script == "install" ]]; then
    echo "Installing packages"
    bun install --cwd data
    bun install --cwd frontend
  else
    if grep -q "\"$script\":" "data/package.json"; then
      echo "Running in /data"
      bun --cwd data $script -- $params
    fi
    if grep -q "\"$script\":" "frontend/package.json"; then
      echo "Running in /frontend"
      bun --cwd frontend $script -- $params
    fi
  fi
fi
