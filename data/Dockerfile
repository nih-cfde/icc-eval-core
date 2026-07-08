FROM oven/bun

WORKDIR /data

# copy in package.json and bun.lock
COPY package.json bun.lock ./

# Install JS dependencies first
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Then install Playwright browsers and Linux dependencies
RUN bunx playwright install --with-deps chromium

# copy in app code
COPY . .

CMD ["bun", "run", "gather"]
