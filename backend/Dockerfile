# Dockerfile for Backend Deployment
FROM denoland/deno:alpine-1.40.0

# Set working directory
WORKDIR /app

# Copy deno config and dependencies
COPY deno.json ./
COPY server/ ./server/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/make-server-02adf113/health || exit 1

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "server/index.ts"]
