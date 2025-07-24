const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Simplified Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

exports.supabase = createClient(supabaseUrl, supabaseKey);

// Storage helper functions
exports.uploadProductImage = async (fileBuffer, fileName, bucket = 'product-images') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer);

  if (error) throw error;
  return data;
};

exports.getPublicUrl = (fileName, bucket = 'product-images') => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  return publicUrl;
};

// Product model methods
exports.createProduct = async (productData) => {
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

exports.updateProduct = async (id, productData) => {
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