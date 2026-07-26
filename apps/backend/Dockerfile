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
COPY tsconfig.json drizzle.config.ts banner-nino-color.txt ./

# Expose port
EXPOSE 3000

# Environment defaults
ENV PORT=4000
ENV NODE_ENV=production

# Command to run backend
CMD ["bun", "run", "api/index.ts"]
