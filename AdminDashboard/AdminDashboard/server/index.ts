import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./storage";

const app = express();

// Production security and performance middleware
if (process.env.NODE_ENV === "production") {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
  
  // Compression for better performance
  app.use(compression());
  
  // CORS for production
  app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
} else {
  // Development CORS - more permissive
  app.use(cors());
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  // Initialize database with seed data if needed
  await initializeDatabase();

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log error for debugging (but don't expose sensitive info in production)
    if (process.env.NODE_ENV === "production") {
      console.error(`Error ${status} on ${req.method} ${req.path}:`, err.message);
      // Only show generic message in production for security
      const message = status < 500 ? err.message : "Internal Server Error";
      res.status(status).json({ message });
    } else {
      // Development: show full error details
      console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
      res.status(status).json({ 
        message: err.message || "Internal Server Error",
        stack: err.stack 
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
