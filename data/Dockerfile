FROM oven/bun

WORKDIR /data

# copy in package.json and bun.lock
COPY package.json bun.lock ./

# Install JS dependencies
RUN bun install

# Install Playwright browsers and Linux dependencies
RUN bun run install-playwright

# copy in app code
COPY . .

CMD ["bun", "run", "gather"]
