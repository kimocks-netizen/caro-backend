//supabaseModel.js
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration - will be passed from env
export const createSupabaseClient = (env) => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('SUPABASE_URL:', !!env.SUPABASE_URL);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!env.SUPABASE_SERVICE_ROLE_KEY);
    console.error('SUPABASE_KEY:', !!env.SUPABASE_KEY);
    throw new Error('Missing Supabase environment variables');
  }

  // Create Supabase client with available key
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Storage helper functions
export const uploadProductImage = async (supabase, fileBuffer, fileName, bucket = 'product-images') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer);

  if (error) throw error;
  return data;
};

export const getPublicUrl = (supabase, fileName, bucket = 'product-images') => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  return publicUrl;
};

// Product model methods
export const createProduct = async (supabase, productData) => {
  // Ensure image_url is properly formatted
  const images = Array.isArray(productData.image_url) 
    ? productData.image_url 
    : productData.image_url ? [productData.image_url] : [];

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...productData, image_url: images }])
    .select('*')
    .single();

  return { data, error };
};

export const updateProduct = async (supabase, id, productData) => {
  // Handle image_url formatting
  const updateData = { ...productData };
  if (productData.image_url) {
    updateData.image_url = Array.isArray(productData.image_url)
      ? productData.image_url
      : [productData.image_url];
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  return { data, error };
};