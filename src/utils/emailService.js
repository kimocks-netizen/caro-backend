const { supabase } = require('../models/supabaseModel');
const { ApiResponse } = require('./apiResponse');
const { Resend } = require('resend');

const resend = new Resend('re_gHQZVsHx_6jsaKHZGWGNrjWNqjeBHtEa8');

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

    // Send email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: 'noreply@carogroupinvestments.com',
      to: email,
      subject: 'Your Quote Request Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFFFF; color: #000000;">
          <h2 style="color: #6D28D9; font-size: 24px;">Thank you for your quote request!</h2>
          <p style="color: #000000;">Your tracking code is: <strong style="color: #FCD34D;">${trackingCode}</strong></p>
          <p style="color: #000000;">To verify your email and complete the quote request, please use the following verification code:</p>
          <div style="background: #F8F9FA; padding: 16px; text-align: center; margin: 16px 0; font-size: 24px; letter-spacing: 2px; border: 1px solid #E5E7EB; border-radius: 4px;">
            <span style="color: #6D28D9; font-weight: bold;">${code}</span>
          </div>
          <p style="color: #000000;">This code will expire in 15 minutes.</p>
          <p style="color: #000000;">You can track your quote status at any time using your tracking code.</p>
          <p style="margin-top: 32px; font-size: 12px; color: #6B7280;">
            If you didn't request this quote, please ignore this email.
          </p>
        </div>
      `
    });

    if (emailError) throw emailError;
    
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

exports.sendQuoteConfirmationEmail = async (email, trackingCode) => {
  try {
    // Send confirmation email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: 'noreply@carogroupinvestments.com',
      to: email,
      subject: 'Quote Request Submitted Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFFFF; color: #000000;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6D28D9; margin: 0; font-size: 28px;">Quote Request Submitted!</h1>
          </div>
          
          <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #000000;">Your tracking code is:</p>
            <div style="background: #6D28D9; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 4px;">
              ${trackingCode}
            </div>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #000000;">
            Check your email <strong style="color: #FCD34D;">${email}</strong> for tracking updates. Our team will review your request and get back to you within 24 hours.
          </p>
          
          <div style="background: #F8F9FA; padding: 15px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
            <p style="margin: 0; font-size: 14px; color: #FCD34D;">
              <strong>What's next?</strong><br>
              <span style="color: #000000;">
              • Our team will review your quote request<br>
              • We'll prepare a detailed quote for your items<br>
              • You'll receive an email with the quote details<br>
              • You can track your quote status anytime using your tracking code
              </span>
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">
              This email was sent from Caro Group Investments. If you didn't request this quote, please ignore this email.
            </p>
          </div>
        </div>
      `
    });

    if (emailError) throw emailError;
    
    return { success: true };
  } catch (error) {
    console.error('Confirmation email sending error:', error);
    throw new Error('Failed to send confirmation email');
  }
};

exports.verifyCode = async (email, code) => {
  try {
    console.log('Looking up verification code:', { email, code });
    
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('contact', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .eq('used', false)
      .single();

    console.log('Verification code lookup:', { data, error });

    if (error || !data) {
      return { valid: false, message: 'Invalid or expired code' };
    }

    console.log('Marking verification code as used');
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', data.id);

    console.log('Updating quote as verified for email:', email);
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ verified: true })
      .eq('guest_email', email);
    
    console.log('Quote update result:', { updateError });

    return { valid: true };
  } catch (error) {
    console.error('Verification error:', error);
    throw new Error('Verification failed');
  }
};