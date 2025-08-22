const express = require('express');
const router = express.Router();

// TODO: Implement shop routes
router.get('/', (req, res) => {
  res.json({ message: 'Shop routes - to be implemented' });
});

module.exports = router;
