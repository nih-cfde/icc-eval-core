eslintArgs=""
prettierArgs="--check"

if [ "$FIX" ]; then
  eslintArgs="--fix"
  prettierArgs="--write"
fi

yarn eslint . --ext .ts,.vue $eslintArgs
yarn prettier **/*.{ts,vue,css,html,md} $prettierArgs --no-error-on-unmatched-pattern
