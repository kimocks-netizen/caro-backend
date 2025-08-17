//quoteController.js
import { createSupabaseClient } from '../models/supabaseModel.js';
import { generateTrackingCode } from '../utils/generateTracking.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Generate quote number
const generateQuoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QUO-${year}${month}-${random}`;
};

export const submitQuote = async (body, env) => {
  const { name, email, items, message } = body;

  // Add debugging
  console.log('Received quote submission:', { name, email, items, message });

  // Test Supabase connection
  try {
    const supabase = createSupabaseClient(env);
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return ApiResponse.error(`Database connection failed: ${testError.message}`, 500);
    }
    console.log('Supabase connection test successful');
  } catch (error) {
    console.error('Supabase connection error:', error);
    return ApiResponse.error('Database connection error', 500);
  }

  // Validate required fields
  if (!name || !email || !items || !Array.isArray(items) || items.length === 0) {
    return ApiResponse.error('Missing required fields: name, email, and items array', 400);
  }

  try {
    const supabase = createSupabaseClient(env);
    
    // Validate that all products exist before creating the quote
    const productIds = items.map(item => item.productId);
    console.log('Product IDs to validate:', productIds);
    
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds);

    if (productsError) {
      console.error('Products validation error:', productsError);
      return ApiResponse.error(`Database error: ${productsError.message}`, 500);
    }

    console.log('Existing products found:', existingProducts);

    // Check if all products exist
    const existingProductIds = existingProducts.map(p => p.id);
    const missingProducts = productIds.filter(id => !existingProductIds.includes(id));
    
    if (missingProducts.length > 0) {
      console.log('Missing products:', missingProducts);
      return ApiResponse.error(`Products not found: ${missingProducts.join(', ')}`, 400);
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
      return ApiResponse.error(`Failed to create quote: ${quoteError.message}`, 500);
    }

    console.log('Quote created:', quote);

    // Create quote items
    const quoteItems = items.map((item) => ({
      quote_id: quote.id,
      product_id: item.productId,
      quantity: item.quantity,
      message: item.message || ''
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems);

    if (itemsError) {
      console.error('Quote items creation error:', itemsError);
      // Try to delete the quote if items creation fails
      await supabase.from('quotes').delete().eq('id', quote.id);
      return ApiResponse.error(`Failed to create quote items: ${itemsError.message}`, 500);
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, trackingCode, env);
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the quote creation if email fails
    }

    return ApiResponse.success({
      quote_id: quote.id,
      tracking_code: trackingCode,
      quote_number: quoteNumber,
      message: 'Quote submitted successfully'
    }, 'Quote submitted successfully', 201);

  } catch (error) {
    console.error('Submit quote error:', error);
    return ApiResponse.error('Failed to submit quote');
  }
};

export const getQuoteById = async (id, env) => {
  try {
    const supabase = createSupabaseClient(env);
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          *,
          products (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !quote) {
      return ApiResponse.error('Quote not found', 404);
    }

    return ApiResponse.success(quote, 'Quote retrieved successfully');
  } catch (error) {
    console.error('Get quote by ID error:', error);
    return ApiResponse.error('Failed to retrieve quote');
  }
};

export const getAllQuotes = async (env) => {
  try {
    const supabase = createSupabaseClient(env);
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          *,
          products (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ApiResponse.success(quotes, 'Quotes retrieved successfully');
  } catch (error) {
    console.error('Get all quotes error:', error);
    return ApiResponse.error('Failed to retrieve quotes');
  }
};

export const updateQuoteStatus = async (id, body, env) => {
  try {
    const { status } = body;
    if (!status) {
      return ApiResponse.error('Status is required', 400);
    }

    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return ApiResponse.error('Quote not found', 404);
    }

    return ApiResponse.success(data, 'Quote status updated successfully');
  } catch (error) {
    console.error('Update quote status error:', error);
    return ApiResponse.error('Failed to update quote status');
  }
};