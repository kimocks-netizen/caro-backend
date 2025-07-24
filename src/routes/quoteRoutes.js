const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  submitQuote,
  getQuoteByTracking,
  getAllQuotes,
  getQuoteById,
  updateQuoteStatus,
  updateQuotePricing,
  issueQuote
} = require('../controllers/quoteController');

const router = express.Router();

// Public routes
router.post('/', submitQuote);
router.get('/:trackingCode', getQuoteByTracking);

// Admin routes (require authentication)
router.get('/', authenticate, adminOnly, getAllQuotes);
router.get('/admin/:id', authenticate, adminOnly, getQuoteById);
router.put('/:id/status', authenticate, adminOnly, updateQuoteStatus);
router.put('/:id/pricing', authenticate, adminOnly, updateQuotePricing);
router.put('/:id/issue', authenticate, adminOnly, issueQuote);

module.exports = router;