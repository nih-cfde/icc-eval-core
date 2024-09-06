data="npm run --prefix data"
app="npm run --prefix app"

regex="^.*--([A-Za-z-]+) ?(.*)$"

# install packages
if [[ $* == *--install* ]]; then
  bun install --cwd data
  bun install --cwd app

# run script in /data and /app
elif [[ $* =~ $regex ]]; then
  script="\"${BASH_REMATCH[1]}\":"
  if grep -q $script "data/package.json"; then
    $data ${BASH_REMATCH[1]} -- ${BASH_REMATCH[2]}
  fi
  if grep -q $script "app/package.json"; then
    $app ${BASH_REMATCH[1]} -- ${BASH_REMATCH[2]}
  fi

# run main pipeline steps
else
  $data ingest
  $data print
  if [[ -z "$CI" ]]; then
    $app dev
  fi
fi
