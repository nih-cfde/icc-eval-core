# run individual pipeline step
if [[ $* == *--ingest* ]]; then
  yarn --cwd ./data/ ingest
elif [[ $* == *--collate* ]]; then
  yarn --cwd ./data/ collate
elif [[ $* == *--print* ]]; then
  yarn --cwd ./data/ print
elif [[ $* == *--app* ]]; then
  yarn --cwd ./app/ dev

# install packages and other dependenices
elif [[ $* == *--install* ]]; then
  yarn --cwd ./data/ install-playwright
  yarn --cwd ./data/ install
  yarn --cwd ./app/ install

# run tests
elif [[ $* == *--test* ]]; then
  yarn --cwd ./data/ test
  yarn --cwd ./app/ test

# run lint
elif [[ $* == *--lint* ]]; then
  yarn --cwd ./data/ lint
  yarn --cwd ./app/ lint

# hard uninstall packages
elif [[ $* == *--install* ]]; then
  yarn --cwd ./data/ clean
  yarn --cwd ./app/ clean

# run all pipeline steps
else
  yarn --cwd ./data/ ingest
  yarn --cwd ./data/ collate
  yarn --cwd ./data/ print
  if [[ ! -z "$CI" ]]; then
    yarn --cwd ./app/ dev
  fi
fi
