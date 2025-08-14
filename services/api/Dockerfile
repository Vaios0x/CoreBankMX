FROM node:20-alpine AS base
WORKDIR /app

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

COPY package.json tsconfig.json ./
COPY src ./src

RUN pnpm install --no-frozen-lockfile
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/server.js"]


