#!/usr/bin/env bash

data="npm run --prefix data"
app="npm run --prefix app"

regex="^.*--([A-Za-z-]+) ?(.*)$"

# run script in /data and /app
if [[ $* =~ $regex ]]; then
  script=${BASH_REMATCH[1]}
  params=${BASE_REMATCH[2]}

  echo "Running script: $script"
  echo "With params: $params"

  if [[ $script == "install" ]]; then
    # install packages with bun
    bun install --cwd data
    bun install --cwd app
  else
    # run script with node
    if grep -q "\"$script\":" "data/package.json"; then
      $data $script -- $params
    fi
    if grep -q "\"$script\":" "app/package.json"; then
      $app $script -- $params
    fi
  fi

# run main pipeline steps
else
  $data ingest
  $data print
  if [[ -z "$CI" ]]; then
    $app dev
  fi
fi

