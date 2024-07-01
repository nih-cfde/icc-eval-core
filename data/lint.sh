eslintArgs=""
prettierArgs="--check"

if [ "$FIX" ]; then
  eslintArgs="--fix"
  prettierArgs="--write"
fi

yarn eslint . --ext .ts $eslintArgs
yarn prettier **/*.{ts,md} $prettierArgs --no-error-on-unmatched-pattern
