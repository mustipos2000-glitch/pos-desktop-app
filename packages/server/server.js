const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const apiRoutes = require('./routes/api');

// Mount API routes
app.use('/api', apiRoutes);

// Serve React app in production
if (!isDev) {
  // Determine the correct path to the client build
  let clientBuildPath;

  if (process.resourcesPath) {
    // Running as packaged app - check unpacked location first
    clientBuildPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'client', 'build');
    if (!require('fs').existsSync(clientBuildPath)) {
      clientBuildPath = path.join(process.resourcesPath, 'app.asar', 'packages', 'client', 'build');
    }
    if (!require('fs').existsSync(clientBuildPath)) {
      clientBuildPath = path.join(process.resourcesPath, 'app', 'packages', 'client', 'build');
    }
  } else {
    // Running from source
    clientBuildPath = path.join(__dirname, '../client/build');
  }

  app.use(express.static(clientBuildPath));

  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Test routes
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Node.js Backend! 🎉',
    timestamp: new Date().toISOString(),
    status: 'Server is running successfully'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
