data="yarn --cwd ./data/"
app="yarn --cwd ./app/"

# run individual pipeline step
if [[ $* == *--ingest* ]]; then
  $data ingest
elif [[ $* == *--print* ]]; then
  $data print
elif [[ $* == *--app* ]]; then
  $app dev

# install packages and other dependenices
elif [[ $* == *--install-all* ]]; then
  $data install
  $app install
  $data install-playwright

# install packages
elif [[ $* == *--install* ]]; then
  $data install
  $app install

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
    $app dev
  fi
fi
