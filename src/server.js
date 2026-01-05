// ═══════════════════════════════════════════════════════════════════════════
// SERVER.JS - Main Entry Point
// Excel Intelligence Bot - 2025 Edition
// Combines Discord Bot + Web Dashboard + REST API
// ═══════════════════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  enableBot: process.env.ENABLE_BOT !== 'false',
  enableWeb: process.env.ENABLE_WEB_DASHBOARD !== 'false',
  enableApi: process.env.ENABLE_API !== 'false',
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING UTILITY
// ─────────────────────────────────────────────────────────────────────────────

const logger = {
  info: (msg) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`),
  success: (msg) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`),
  debug: (msg) => {
    if (config.nodeEnv === 'development') {
      console.log(`[${new Date().toISOString()}] 🔍 ${msg}`);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENSURE DIRECTORIES EXIST
// ─────────────────────────────────────────────────────────────────────────────

const ensureDirectories = () => {
  const dirs = [
    path.join(__dirname, '../temp'),
    path.join(__dirname, '../logs')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPRESS APP SETUP
// ─────────────────────────────────────────────────────────────────────────────

const createExpressApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS
  app.use(cors({
    origin: config.nodeEnv === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || true
      : true,
    credentials: true
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.debug(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  return app;
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FILES & WEB DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const setupWebDashboard = (app) => {
  const publicPath = path.join(__dirname, 'web/public');

  // Serve static files
  app.use(express.static(publicPath, {
    maxAge: config.nodeEnv === 'production' ? '1d' : 0
  }));

  // Serve index.html for root
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  logger.success('Web Dashboard enabled');
};

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const setupApiRoutes = async (app) => {
  try {
    const apiRoutes = await import('./web/routes/api.js');
    app.use('/api', apiRoutes.default);
    logger.success('REST API enabled at /api');
  } catch (error) {
    logger.error(`Failed to load API routes: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DISCORD BOT
// ─────────────────────────────────────────────────────────────────────────────

const startDiscordBot = async () => {
  if (!config.discordToken) {
    logger.warn('DISCORD_TOKEN not set - Bot disabled');
    return null;
  }

  try {
    const { bot } = await import('./bot/index.js');
    await bot.start(config.discordToken);
    logger.success('Discord Bot started');
    return bot;
  } catch (error) {
    logger.error(`Failed to start Discord bot: ${error.message}`);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const setupErrorHandlers = (app) => {
  // 404 handler
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Endpoint not found' });
    } else {
      // Serve index.html for SPA routing
      res.sendFile(path.join(__dirname, 'web/public/index.html'));
    }
  });

  // Global error handler
  app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    logger.debug(err.stack);

    res.status(err.status || 500).json({
      error: config.nodeEnv === 'production' 
        ? 'Internal server error' 
        : err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────

const setupGracefulShutdown = (server, bot) => {
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      // Shutdown Discord bot
      if (bot) {
        await bot.shutdown();
      }

      // Cleanup temp files
      try {
        const tempDir = path.join(__dirname, '../temp');
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(tempDir, file));
          }
        });
        logger.info('Temp files cleaned');
      } catch (e) {
        // Ignore cleanup errors
      }

      logger.success('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.debug(error.stack);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN STARTUP
// ─────────────────────────────────────────────────────────────────────────────

const main = async () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║   📊 EXCEL INTELLIGENCE BOT                                   ║');
  console.log('║   Version 2.0.0 - 2025 Edition                                ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Node.js: ${process.version}`);

  // Ensure directories exist
  ensureDirectories();

  // Create Express app
  const app = createExpressApp();

  // Setup Web Dashboard
  if (config.enableWeb) {
    setupWebDashboard(app);
  }

  // Setup API Routes
  if (config.enableApi) {
    await setupApiRoutes(app);
  }

  // Setup error handlers
  setupErrorHandlers(app);

  // Start HTTP server
  const server = app.listen(config.port, () => {
    logger.success(`HTTP Server running on port ${config.port}`);
    
    if (config.enableWeb) {
      logger.info(`Dashboard: http://localhost:${config.port}`);
    }
    if (config.enableApi) {
      logger.info(`API: http://localhost:${config.port}/api`);
    }
  });

  // Start Discord Bot
  let bot = null;
  if (config.enableBot) {
    bot = await startDiscordBot();
  }

  // Setup graceful shutdown
  setupGracefulShutdown(server, bot);

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🚀 All services started successfully!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');

  return { app, server, bot };
};

// Run main
main().catch(error => {
  logger.error(`Startup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

export default main;
