FROM oven/bun

WORKDIR /app

# copy in package.json and bun.lock
COPY package.json bun.lock ./

# install dependencies
RUN bun install

# copy in app code
COPY . .

EXPOSE 5173

CMD ["bun", "run", "dev", "--host", "--no-open"]
