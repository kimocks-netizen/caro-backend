const { supabase } = require('../models/supabaseModel');
const { ApiResponse } = require('./apiResponse');

exports.sendVerificationEmail = async (email, trackingCode) => {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const { error } = await supabase
      .from('verification_codes')
      .insert([{
        contact: email,
        code,
        expires_at: expiresAt
      }]);

    if (error) throw error;

    const { error: emailError } = await supabase
      .functions
      .invoke('send-email', {
        body: JSON.stringify({
          to: email,
          subject: 'Your Quote Request Verification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6D28D9;">Thank you for your quote request!</h2>
              <p>Your tracking code is: <strong>${trackingCode}</strong></p>
              <p>To verify your email and complete the quote request, please use the following verification code:</p>
              <div style="background: #F3F4F6; padding: 16px; text-align: center; margin: 16px 0; font-size: 24px; letter-spacing: 2px;">
                ${code}
              </div>
              <p>This code will expire in 15 minutes.</p>
              <p>You can track your quote status at any time using your tracking code.</p>
              <p style="margin-top: 32px; font-size: 12px; color: #6B7280;">
                If you didn't request this quote, please ignore this email.
              </p>
            </div>
          `
        })
      });

    if (emailError) throw emailError;
    
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

exports.verifyCode = async (email, code) => {
  try {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('contact', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .eq('used', false)
      .single();

    if (error || !data) {
      return { valid: false, message: 'Invalid or expired code' };
    }

    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', data.id);

    await supabase
      .from('quotes')
      .update({ verified: true })
      .eq('guest_email', email);

    return { valid: true };
  } catch (error) {
    console.error('Verification error:', error);
    throw new Error('Verification failed');
  }
};