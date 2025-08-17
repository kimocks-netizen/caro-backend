//verificationController.js
import { createSupabaseClient } from '../models/supabaseModel.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { verifyCode, sendVerificationEmail } from '../utils/emailService.js';

export const verifyEmailCode = async (body, env) => {
  const { email, code } = body;

  try {
    const { valid, message } = await verifyCode(email, code, env);
    
    if (!valid) {
      return ApiResponse.error(message || 'Invalid verification code', 400);
    }

    return ApiResponse.success(null, 'Email verified successfully');
  } catch (error) {
    console.error('Verification error:', error);
    return ApiResponse.error('Verification failed');
  }
};

export const resendVerification = async (body, env) => {
  const { email, trackingCode } = body;

  try {
    await sendVerificationEmail(email, trackingCode, env);
    return ApiResponse.success(null, 'Verification email resent');
  } catch (error) {
    console.error('Resend verification error:', error);
    return ApiResponse.error('Failed to resend verification');
  }
};