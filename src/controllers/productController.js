const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../models/supabaseModel');
const ApiResponse = require('../utils/apiResponse');
const { uploadFiles, deleteFiles } = require('../utils/supabaseStorageHelper'); // helper to upload/delete images

// Multer setup for memory storage (files available as Buffer in req.files)
const storage = multer.memoryStorage();
exports.uploadMiddleware = multer({ storage }).array('images', 5); // max 5 images, change as needed

// Existing controllers unchanged except createProduct (and optionally updateProduct for images)

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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    return ApiResponse.success(res, data);
  } catch (error) {
    console.error('Get product error:', error);
    return ApiResponse.error(res, 'Failed to fetch product');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productId = uuidv4();
    const productData = req.body;

    // Upload images from req.files (multer)
    const imageUrls = await uploadFiles(productId, req.files);

    // Prepare data for insert
    const insertData = {
      id: productId,
      title: productData.title,
      description: productData.description,
      image_url: imageUrls,
      category: productData.category,
      available: productData.available !== undefined ? productData.available : true,
      price_range: productData.price_range,
      tags: productData.tags ? productData.tags.split(',').map(t => t.trim()) : [],
    };

    const { data, error } = await supabase
      .from('products')
      .insert([insertData])
      .select('*')
      .single();

    if (error) throw error;

    return ApiResponse.success(res, data, 'Product created', 201);
  } catch (error) {
    console.error('Create product error:', error);
    return ApiResponse.error(res, 'Failed to create product');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    // Get current product to check existing images
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // If new images uploaded, delete old images and upload new ones
    if (req.files && req.files.length > 0) {
      if (existingProduct.image_url && existingProduct.image_url.length > 0) {
        await deleteFiles(existingProduct.image_url);
      }
      const newImageUrls = await uploadFiles(id, req.files);
      productData.image_url = newImageUrls;
    }

    // If tags is string, convert to array
    if (productData.tags && typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map(t => t.trim());
    }

    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return ApiResponse.success(res, data, 'Product updated');
  } catch (error) {
    console.error('Update product error:', error);
    return ApiResponse.error(res, 'Failed to update product');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete product images from storage
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (product.image_url && product.image_url.length > 0) {
      await deleteFiles(product.image_url);
    }

    // Delete product record
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
