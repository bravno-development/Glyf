FROM denoland/deno:2.6.9

WORKDIR /app

COPY api/deno.json api/imports.ts ./

RUN deno cache imports.ts

COPY api/ .

CMD ["deno", "task", "start"]
