const express = require('express');
const router = express.Router();

// TODO: Implement events routes
router.get('/', (req, res) => {
  res.json({ message: 'Events routes - to be implemented' });
});

module.exports = router;
