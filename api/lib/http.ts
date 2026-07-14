import type { Hono } from "hono";

type App = Hono;

export function setupHttpLogging(app: App) {
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${c.req.method} ${c.req.url} ${c.res.status} ${ms}ms`);
  });
}
