import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const BASE_DOMAIN = process.env.BASE_DOMAIN || "incorpweb.com";

const app: Express = express();

// Trust Cloudflare's proxy layer so X-Forwarded-* headers are used correctly.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);
      const allowed =
        origin === `https://${BASE_DOMAIN}` ||
        origin === `https://www.${BASE_DOMAIN}` ||
        origin.endsWith(`.${BASE_DOMAIN}`) ||
        origin === "https://incorpweb.com" ||
        origin.endsWith(".incorpweb.com") ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        origin.includes(".replit.app") ||
        origin.includes(".replit.dev") ||
        origin.includes(".repl.co");
      callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
