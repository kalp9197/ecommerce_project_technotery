// Export all configurations from this file
import { dbConfig, createDbPool, pool } from './db.config.js';
import { createDevTransporter, defaultSender } from './email.config.js';
import { stripeConfig, stripe } from './payment.config.js';
import { appConfig, rateLimiter } from './app.config.js';

export {
  // Database config
  dbConfig,
  createDbPool,
  pool,
  
  // Email config
  createDevTransporter,
  defaultSender,
  
  // Payment config
  stripeConfig,
  stripe,
  
  // App config
  appConfig,
  rateLimiter
};
