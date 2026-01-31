#!/usr/bin/env node

/**
 * Custom Next.js standalone server
 * Ensures the server listens on 0.0.0.0 for Docker deployments
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Read environment variables
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

console.log('🚀 Starting Next.js server...');
console.log(`   - Environment: ${dev ? 'development' : 'production'}`);
console.log(`   - Hostname: ${hostname}`);
console.log(`   - Port: ${port}`);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    console.log(`✅ Server ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  process.exit(1);
});
