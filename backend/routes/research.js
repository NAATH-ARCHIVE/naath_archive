const express = require('express');
const router = express.Router();

// TODO: Implement research routes
router.get('/', (req, res) => {
  res.json({ message: 'Research routes - to be implemented' });
});

module.exports = router;
