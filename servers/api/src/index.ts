import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

const app = new Hono();
app.use("/*", cors());

/**
 * This is a sample route that uses the Hono RPC client
 * @see https://hono.dev/docs/concepts/routers
 */
const route = app
  .post(
    "/posts",
    zValidator(
      "form",
      z.object({
        title: z.string(),
        body: z.string(),
      }),
    ),
    (c) => {
      // ...
      return c.json(
        {
          ok: true,
          message: "Created!",
        },
        201,
      );
    },
  )
  .get("/healthz", (c) => {
    return c.json({ status: "ok" });
  });

// biome-ignore lint/style/noDefaultExport: Required by Bun
export default {
  fetch: app.fetch,
  port: 3000,
};

/**
 * Required for Hono RPC client
 * This is used in the client to infer the types of the request and response
 * @see https://hono.dev/docs/guides/rpc
 */
export type AppType = typeof route;
