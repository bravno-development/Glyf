FROM denoland/deno:2.1.4

WORKDIR /app

# Copy dependency files
COPY api/deno.json api/imports.ts ./

# Cache dependencies
RUN deno cache imports.ts

# Copy source code
COPY api/ .

# Default command (can be overridden in docker-compose)
CMD ["deno", "task", "start"]
