# API Error Responses

Use HTTP status codes and a single `error` field with a short, user-friendly
message.

```json
res.status(400).json({ error: "Email is required" });
res.status(401).json({ error: "No token provided" });
res.status(404).json({ error: "User not found" });
res.status(500).json({ error: "Failed to fetch profile" });
```

- **Always** set the correct status (4xx client, 5xx server) and include
  `error: string`.
- Keep messages **short and safe** for the client; log full details server-side.
- Extra fields (e.g. `field`, `code`) are allowed when needed; for now status +
  `error` is enough.
- No error codes (e.g. AUTH_001); this project keeps it simple.
- Global error handler may add `message` and `stack` in development only.
