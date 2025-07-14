const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      transcription: 'available',
      summarization: 'available', 
      translation: 'available',
      qa: 'available',
      pdf: 'available'
    },
    version: '1.0.0'
  };

  res.json(healthStatus);
});

module.exports = router;
