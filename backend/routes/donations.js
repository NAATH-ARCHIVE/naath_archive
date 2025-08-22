const express = require('express');
const router = express.Router();

// TODO: Implement donations routes
router.get('/', (req, res) => {
  res.json({ message: 'Donations routes - to be implemented' });
});

module.exports = router;
