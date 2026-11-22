# Imagens oficiais multi-arquitetura (linux/amd64 e linux/arm64).
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd -g 1001 nodeapp && useradd -r -u 1001 -g nodeapp nodeapp && mkdir -p /srv/atletica/storage && chown -R nodeapp:nodeapp /srv/atletica
COPY --from=builder --chown=nodeapp:nodeapp /app/.next/standalone ./
COPY --from=builder --chown=nodeapp:nodeapp /app/.next/static ./.next/static
COPY --from=builder --chown=nodeapp:nodeapp /app/public ./public
COPY --from=builder --chown=nodeapp:nodeapp /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodeapp:nodeapp /app/node_modules/@prisma/client ./node_modules/@prisma/client
USER nodeapp
EXPOSE 3000
CMD ["node", "server.js"]
