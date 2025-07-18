const { supabase } = require('../models/supabaseModel');
const { ApiResponse } = require('../utils/apiResponse');
const { verifyCode, sendVerificationEmail } = require('../utils/emailService');

exports.verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const { valid, message } = await verifyCode(email, code);
    
    if (!valid) {
      return ApiResponse.error(res, message || 'Invalid verification code', 400);
    }

    return ApiResponse.success(res, null, 'Email verified successfully');
  } catch (error) {
    console.error('Verification error:', error);
    return ApiResponse.error(res, 'Verification failed');
  }
};

exports.resendVerification = async (req, res) => {
  const { email, trackingCode } = req.body;

  try {
    await sendVerificationEmail(email, trackingCode);
    return ApiResponse.success(res, null, 'Verification email resent');
  } catch (error) {
    console.error('Resend verification error:', error);
    return ApiResponse.error(res, 'Failed to resend verification');
  }
};