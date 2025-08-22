const express = require('express');
const router = express.Router();

// TODO: Implement education routes
router.get('/', (req, res) => {
  res.json({ message: 'Education routes - to be implemented' });
});

module.exports = router;
