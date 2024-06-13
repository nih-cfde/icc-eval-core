eslintArgs=""
prettierArgs="--check"

if [ "$FIX" ]; then
  eslintArgs="--fix"
  prettierArgs="--write"
fi

bun eslint . --ext .ts,.vue $eslintArgs
bun prettier **/*.{ts,vue,css,html,md} $prettierArgs --no-error-on-unmatched-pattern
