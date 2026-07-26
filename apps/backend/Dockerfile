# Use official Bun lightweight Alpine image
FROM oven/bun:1.2-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifest
COPY package.json ./

# Install dependencies
RUN bun install --production

# Copy application files
COPY src ./src
COPY public ./public
COPY api ./api
COPY tsconfig.json drizzle.config.ts ./

# Expose port
EXPOSE 3000

# Environment defaults
ENV PORT=3000
# Note: NODE_ENV set to 'docker' (or non-'production') so app.listen() is executed by src/index.ts
ENV NODE_ENV=docker

# Command to run backend
CMD ["bun", "run", "src/index.ts"]
