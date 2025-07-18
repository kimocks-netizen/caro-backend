const { supabase } = require('../models/supabaseModel');
const { ApiResponse } = require('../utils/apiResponse');

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

exports.createProduct = async (req, res) => {
  const productData = req.body;

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
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
  const { id } = req.params;
  const productData = req.body;

  try {
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
  const { id } = req.params;

  try {
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