const { supabase } = require('../models/supabaseModel');
const { generateTrackingCode } = require('../utils/generateTracking');
const { sendVerificationEmail } = require('../utils/emailService');
const { ApiResponse } = require('../utils/apiResponse');

// Generate quote number
const generateQuoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QUO-${year}${month}-${random}`;
};

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
    const quoteNumber = generateQuoteNumber();

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        tracking_code: trackingCode,
        quote_number: quoteNumber,
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

    return ApiResponse.success(res, { trackingCode, quoteNumber }, 'Quote submitted successfully', 201);
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

exports.getQuoteById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!quote) return ApiResponse.error(res, 'Quote not found', 404);

    return ApiResponse.success(res, quote);
  } catch (error) {
    console.error('Get quote by ID error:', error);
    return ApiResponse.error(res, 'Failed to fetch quote');
  }
};

exports.updateQuoteStatus = async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  console.log('Updating quote:', { id, status, admin_notes });

  // Validate status
  const validStatuses = ['pending', 'in_progress', 'quoted', 'quote_issued', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return ApiResponse.error(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  try {
    const updateData = {};
    if (status) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    updateData.updated_at = new Date().toISOString();

    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Quote updated successfully:', data);
    return ApiResponse.success(res, data, 'Quote updated');
  } catch (error) {
    console.error('Update quote error:', error);
    return ApiResponse.error(res, 'Failed to update quote');
  }
};

exports.updateQuotePricing = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  try {
    // Update each quote item with pricing
    for (const item of items) {
      const { error } = await supabase
        .from('quote_items')
        .update({
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        })
        .eq('id', item.id);

      if (error) throw error;
    }

    // Get updated quote with calculated totals
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return ApiResponse.success(res, quote, 'Quote pricing updated');
  } catch (error) {
    console.error('Update quote pricing error:', error);
    return ApiResponse.error(res, 'Failed to update quote pricing');
  }
};

exports.issueQuote = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  try {
    // Update quote status to issued
    const { error: statusError } = await supabase
      .from('quotes')
      .update({ 
        status: 'quote_issued',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (statusError) throw statusError;

    // Update pricing if provided
    if (items && items.length > 0) {
      for (const item of items) {
        const { error } = await supabase
          .from('quote_items')
          .update({
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity
          })
          .eq('id', item.id);

        if (error) throw error;
      }
    }

    // Get updated quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return ApiResponse.success(res, quote, 'Quote issued successfully');
  } catch (error) {
    console.error('Issue quote error:', error);
    return ApiResponse.error(res, 'Failed to issue quote');
  }
};