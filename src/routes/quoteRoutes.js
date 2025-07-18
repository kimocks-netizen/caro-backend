const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  submitQuote,
  getQuoteByTracking,
  getAllQuotes,
  updateQuoteStatus
} = require('../controllers/quoteController');

const router = express.Router();

router.post('/', submitQuote);
router.get('/:trackingCode', getQuoteByTracking);
router.get('/', authenticate, adminOnly, getAllQuotes);
router.put('/:id/status', authenticate, adminOnly, updateQuoteStatus);

module.exports = router;