#!/usr/bin/env bash

set -e

export NODE_OPTIONS="--max_old_space_size=8192"

data="npm run --prefix data"
app="npm run --prefix app"

regex="--([A-Za-z0-9:-]+)\s*(.*)?$"

# run script in /data and /app
if [[ $* =~ $regex ]]; then
  script=${BASH_REMATCH[1]}
  params=${BASH_REMATCH[2]}

  echo "Running script: '$script'"
  echo "With params: '$params'"

    # install packages with bun
  if [[ $script == "install" ]]; then
    echo "Installing packages"
    bun install --cwd data
    bun install --cwd app
  else
    # run script with node
    if grep -q "\"$script\":" "data/package.json"; then
      echo "Running in /data"
      $data $script -- $params
    fi
    if grep -q "\"$script\":" "app/package.json"; then
      echo "Running in /app"
      $app $script -- $params
    fi
  fi

# run main pipeline steps
else
  echo "Running main pipeline steps"
  $data gather
  $data print
  if [[ -z "$CI" ]]; then
    $app dev
  fi
fi
