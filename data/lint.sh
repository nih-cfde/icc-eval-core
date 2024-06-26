eslintArgs=""
prettierArgs="--check"

if [ "$FIX" ]; then
  eslintArgs="--fix"
  prettierArgs="--write"
fi

bun eslint . --ext .ts $eslintArgs
bun prettier **/*.ts $prettierArgs --no-error-on-unmatched-pattern
