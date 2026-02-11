# API Validation

- **Validate in the controller.** Check `req.body` (and params/query if needed)
  at the start of the handler. No shared validation layer or schema library for
  now; the project is small and in early stages. Add a schema lib (e.g. Zod)
  later if needed.
- **On validation failure:** `return res.status(400).json({ error: "..." })`
  with a short, user-friendly message. Use the same error shape as in
  [error-responses](error-responses.md).

```ts
if (!email || typeof email !== "string") {
	return res.status(400).json({ error: "Email is required" });
}
if (!script || !reviews) {
	return res.status(400).json({ error: "Script & reviews required" });
}
const goal = Number(dailyGoal);
if (!goal || ![5, 10, 15].includes(goal)) {
	return res.status(400).json({ error: "dailyGoal must be 5, 10 or 15" });
}
```

- The rule stays: validate in the controller and respond with 400 + `{ error }`.
  Only the implementation (inline checks vs a schema lib) may change later.
