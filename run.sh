# if flag, just run individual step
if [[ $* == *--ingest* ]]; then
  yarn --cwd ./data/ ingest
elif [[ $* == *--collate* ]]; then
  yarn --cwd ./data/ collate
elif [[ $* == *--print* ]]; then
  yarn --cwd ./data/ print
elif [[ $* == *--app* ]]; then
  yarn --cwd ./app/ dev
# otherwise, run all steps in order
else
  yarn --cwd ./data/ ingest
  yarn --cwd ./data/ collate
  yarn --cwd ./data/ print
  if [[ ! -z "$CI" ]]; then
    yarn --cwd ./app/ dev
  fi
fi
