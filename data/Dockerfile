FROM oven/bun

WORKDIR /data

# copy in package.json and bun.lock
COPY package.json bun.lock ./

# install playwright
RUN bun run install-playwright

# install dependencies
RUN bun install

# copy in app code
COPY . .

CMD ["bun", "run", "gather"]
