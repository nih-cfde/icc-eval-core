data="npm run --silent --prefix data"
app="npm run --silent --prefix app"
dataBun="--cwd data"
appBun="--cwd app"

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
  bun install $dataBun
  bun install $appBun

# install packages and other dependenices
elif [[ $* == *--install* ]]; then
  bun install $dataBun
  bun install $appBun
  $data install-playwright -- --silent

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
