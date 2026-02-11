# API Centralised Imports

Follow Deno conventions: re-export dependencies from a single **`imports.ts`** at the API root. Controllers, middleware, and routes import from this file instead of from npm/URLs.

```ts
// imports.ts — re-export express, types, postgres, djwt, etc.
export { default as express } from "express";
export type { Request, Response, NextFunction } from "express";
export { Pool } from "postgres";
export { create, verify } from "djwt";
// ...
```

- **Do** use `../../imports.ts` (or the correct relative path) in `src/` for express, types, postgres, djwt, cors, nodemailer.
- **Do not** import those dependencies directly from package names in controllers, middleware, or routes.
- Keeps dependency surface and versioning in one place and aligns with Deno’s recommended approach.
