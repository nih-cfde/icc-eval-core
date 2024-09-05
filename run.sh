data="npm run --prefix data"
app="npm run --prefix app"

regex="^.*--[A-Za-z-]+ (.+)$"
if [[ $* =~ $regex ]]; then
  extraargs="${BASH_REMATCH[1]}"
fi

# run individual pipeline step
if [[ $* == *--ingest* ]]; then
  $data ingest
elif [[ $* == *--print* ]]; then
  $data print
elif [[ $* == *--app* ]]; then
  $app dev -- --open

# run individual script in data
elif [[ $* == *--script* ]]; then
  $data script -- $extraargs

# install just packages
elif [[ $* == *--install-packages* ]]; then
  bun install --cwd data
  bun install --cwd app

# install everything
elif [[ $* == *--install* ]]; then
  bun install --cwd data
  bun install --cwd app
  $data install-playwright

# run tests
elif [[ $* == *--test* ]]; then
  $data test
  $app test

# run lint
elif [[ $* == *--lint* ]]; then
  $data lint
  $app lint

# hard uninstall packages
elif [[ $* == *--clean* ]]; then
  $data clean
  $app clean

# run all pipeline steps
else
  $data ingest
  $data print
  if [[ -z "$CI" ]]; then
    $app dev -- --open
  fi
fi
