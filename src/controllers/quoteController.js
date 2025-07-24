const { supabase } = require('../models/supabaseModel');
const { generateTrackingCode } = require('../utils/generateTracking');
const { sendVerificationEmail } = require('../utils/emailService');
const { ApiResponse } = require('../utils/apiResponse');

exports.submitQuote = async (req, res) => {
  const { name, email, items, message } = req.body;

  // Add debugging
  console.log('Received quote submission:', { name, email, items, message });

  // Test Supabase connection
  try {
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return ApiResponse.error(res, `Database connection failed: ${testError.message}`, 500);
    }
    console.log('Supabase connection test successful');
  } catch (error) {
    console.error('Supabase connection error:', error);
    return ApiResponse.error(res, 'Database connection error', 500);
  }

  // Validate required fields
  if (!name || !email || !items || !Array.isArray(items) || items.length === 0) {
    return ApiResponse.error(res, 'Missing required fields: name, email, and items array', 400);
  }

  try {
    // Validate that all products exist before creating the quote
    const productIds = items.map(item => item.productId);
    console.log('Product IDs to validate:', productIds);
    
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds);

    if (productsError) {
      console.error('Products validation error:', productsError);
      return ApiResponse.error(res, `Database error: ${productsError.message}`, 500);
    }

    console.log('Existing products found:', existingProducts);

    // Check if all products exist
    const existingProductIds = existingProducts.map(p => p.id);
    const missingProducts = productIds.filter(id => !existingProductIds.includes(id));
    
    if (missingProducts.length > 0) {
      console.log('Missing products:', missingProducts);
      return ApiResponse.error(res, `Products not found: ${missingProducts.join(', ')}`, 400);
    }

    const trackingCode = generateTrackingCode();

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        tracking_code: trackingCode,
        guest_name: name,
        guest_email: email,
        notes: message,
        status: 'pending'
      }])
      .select('*')
      .single();

    if (quoteError) {
      console.error('Quote creation error:', quoteError);
      return ApiResponse.error(res, `Failed to create quote: ${quoteError.message}`, 500);
    }

    console.log('Quote created:', quote);

    // Create quote items
    const quoteItems = items.map((item) => ({
      quote_id: quote.id,
      product_id: item.productId,
      quantity: item.quantity,
      message: item.message || ''
    }));

    console.log('Quote items to insert:', quoteItems);

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems);

    if (itemsError) {
      console.error('Quote items insertion error:', itemsError);
      // If quote items fail, we should clean up the quote
      await supabase.from('quotes').delete().eq('id', quote.id);
      return ApiResponse.error(res, `Failed to create quote items: ${itemsError.message}`, 500);
    }

    // Send verification email (optional - don't fail if email fails)
    try {
      await sendVerificationEmail(email, trackingCode);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the quote submission if email fails
    }

    return ApiResponse.success(res, { trackingCode }, 'Quote submitted successfully', 201);
  } catch (error) {
    console.error('Submit quote error:', error);
    return ApiResponse.error(res, 'Failed to submit quote');
  }
};

exports.getQuoteByTracking = async (req, res) => {
  const { trackingCode } = req.params;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .eq('tracking_code', trackingCode)
      .single();

    if (error) throw error;
    if (!quote) return ApiResponse.error(res, 'Quote not found', 404);

    return ApiResponse.success(res, quote);
  } catch (error) {
    console.error('Get quote error:', error);
    return ApiResponse.error(res, 'Failed to fetch quote or Does not exist');
  }
};

exports.getAllQuotes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ApiResponse.success(res, data);
  } catch (error) {
    console.error('Get quotes error:', error);
    return ApiResponse.error(res, 'Failed to fetch quotes Or Does not exsit');
  }
};

exports.updateQuoteStatus = async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({ status, admin_notes })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return ApiResponse.success(res, data, 'Quote updated');
  } catch (error) {
    console.error('Update quote error:', error);
    return ApiResponse.error(res, 'Failed to update quote');
  }
};