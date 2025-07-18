const express = require('express');
const {
  verifyEmailCode,
  resendVerification
} = require('../controllers/verificationController');

const router = express.Router();

router.post('/email', verifyEmailCode);
router.post('/resend', resendVerification);

module.exports = router;