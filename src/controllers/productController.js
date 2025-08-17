//productController.js
const { supabase } = require('../models/supabaseModel');
const { ApiResponse } = require('../utils/apiResponse');

exports.createProduct = async (req, res) => {
  try {
    // 1. First validate required fields
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return ApiResponse.error(res, 'Title, description and category are required', 400);
    }

    // 2. Handle image_url formatting
    let imageUrls = [];
    if (req.body.image_url) {
      imageUrls = Array.isArray(req.body.image_url) 
        ? req.body.image_url.filter(url => typeof url === 'string')
        : [req.body.image_url].filter(url => typeof url === 'string');
    }

    // 3. Create the product data
    const productData = {
      title,
      description,
      category,
      image_url: imageUrls,
      available: req.body.available || true,
      price_range: req.body.price_range || null,
      tags: req.body.tags || []
    };

    // 4. Insert into database
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return ApiResponse.success(res, data, 'Product created', 201);
  } catch (error) {
    console.error('Create product error:', error);
    return ApiResponse.error(res, error.message || 'Failed to create product');
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Validate product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return ApiResponse.error(res, 'Product not found', 404);
    }

    // 2. Prepare update data
    const updateData = {
      title: req.body.title || existingProduct.title,
      description: req.body.description || existingProduct.description,
      category: req.body.category || existingProduct.category,
      available: req.body.available ?? existingProduct.available,
      price_range: req.body.price_range ?? existingProduct.price_range,
      tags: req.body.tags || existingProduct.tags
    };

    // 3. Handle image updates if provided
    if (req.body.image_url) {
      updateData.image_url = Array.isArray(req.body.image_url)
        ? req.body.image_url
        : [req.body.image_url];
    }

    // 4. Perform update
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return ApiResponse.success(res, data, 'Product updated');
  } catch (error) {
    console.error('Update product error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update product');
  }
};
// Add these to your existing productController.js

exports.getAllProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ApiResponse.success(res, data);
  } catch (error) {
    console.error('Get products error:', error);
    return ApiResponse.error(res, 'Failed to fetch products');
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return ApiResponse.error(res, 'Product not found', 404);
    
    return ApiResponse.success(res, data);
  } catch (error) {
    console.error('Get product error:', error);
    return ApiResponse.error(res, 'Failed to fetch product');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return ApiResponse.success(res, null, 'Product deleted');
  } catch (error) {
    console.error('Delete product error:', error);
    return ApiResponse.error(res, 'Failed to delete product');
  }
};
// In uploadImage
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    const fileName = `products/${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, req.file.buffer);

    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName).data.publicUrl;

    return ApiResponse.success(res, { url: publicUrl }, 'Image uploaded');
  } catch (error) {
    console.error('Image upload error:', error);
    return ApiResponse.error(res, 'Failed to upload image');
  }
};
