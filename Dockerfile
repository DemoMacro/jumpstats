# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock* ./

# use ignore-scripts to avoid running postinstall hooks
RUN bun install --frozen-lockfile --ignore-scripts

# Copy the entire project
COPY . .

# Build with node-cluster preset
ENV NITRO_PRESET=node_cluster
ENV NODE_ENV=production
ENV SKIP_MIGRATE=true
RUN bun --bun run build

# Bundle migrate script into .output/scripts directory
RUN bun build ./scripts/migrate.ts --outfile ./.output/scripts/migrate.mjs --target=bun --minify

# copy production dependencies and source code into final image
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Copy .output directory (which now contains migrate.mjs)
COPY --from=build /app/.output /app

# Set cluster workers
ENV NITRO_CLUSTER_WORKERS=max
ENV NODE_ENV=production
ENV PORT=3000

# run the app
EXPOSE 3000/tcp
ENTRYPOINT ["sh", "-c", "bun /app/scripts/migrate.mjs && bun --bun run /app/server/index.mjs"]
