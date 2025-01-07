import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure CORS properly for Firebase Auth
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Expose Firebase environment variables to frontend during development
if (process.env.NODE_ENV !== "production") {
  process.env.VITE_FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
  process.env.VITE_FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  process.env.VITE_FIREBASE_APP_ID = process.env.FIREBASE_APP_ID;
}

// Configure security headers
app.use((req, res, next) => {
  // Content Security Policy to allow necessary external resources
  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.google.com https://*.googleapis.com;
    frame-src 'self' https://*.firebaseapp.com https://*.google.com;
    connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.google.com;
    img-src 'self' data: https: blob:;
    style-src 'self' 'unsafe-inline';
    font-src 'self' data:;
  `.replace(/\s+/g, ' ').trim());

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();