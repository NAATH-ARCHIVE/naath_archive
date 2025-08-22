const express = require('express');
const router = express.Router();

// TODO: Implement media routes
router.get('/', (req, res) => {
  res.json({ message: 'Media routes - to be implemented' });
});

module.exports = router;
