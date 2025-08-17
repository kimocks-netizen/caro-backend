//productController.js
import { createSupabaseClient } from '../models/supabaseModel.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const createProduct = async (body, env) => {
  try {
    // 1. First validate required fields
    const { title, description, category } = body;
    if (!title || !description || !category) {
      return ApiResponse.error('Title, description and category are required', 400);
    }

    // 2. Handle image_url formatting
    let imageUrls = [];
    if (body.image_url) {
      imageUrls = Array.isArray(body.image_url) 
        ? body.image_url.filter(url => typeof url === 'string')
        : [body.image_url].filter(url => typeof url === 'string');
    }

    // 3. Create the product data
    const productData = {
      title,
      description,
      category,
      image_url: imageUrls,
      available: body.available || true,
      price_range: body.price_range || null,
      tags: body.tags || []
    };

    // 4. Insert into database
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return ApiResponse.success(data, 'Product created', 201);
  } catch (error) {
    console.error('Create product error:', error);
    return ApiResponse.error(error.message || 'Failed to create product');
  }
};

export const updateProduct = async (id, body, env) => {
  try {
    const supabase = createSupabaseClient(env);
    
    // 1. Validate product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return ApiResponse.error('Product not found', 404);
    }

    // 2. Prepare update data
    const updateData = {
      title: body.title || existingProduct.title,
      description: body.description || existingProduct.description,
      category: body.category || existingProduct.category,
      available: body.available ?? existingProduct.available,
      price_range: body.price_range ?? existingProduct.price_range,
      tags: body.tags || existingProduct.tags
    };

    // 3. Handle image updates if provided
    if (body.image_url) {
      updateData.image_url = Array.isArray(body.image_url)
        ? body.image_url
        : [body.image_url];
    }

    // 4. Perform update
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return ApiResponse.success(data, 'Product updated');
  } catch (error) {
    console.error('Update product error:', error);
    return ApiResponse.error(error.message || 'Failed to update product');
  }
};

export const getAllProducts = async (env) => {
  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ApiResponse.success(data, 'Products retrieved successfully');
  } catch (error) {
    console.error('Get all products error:', error);
    return ApiResponse.error('Failed to retrieve products');
  }
};

export const getProductById = async (id, env) => {
  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return ApiResponse.error('Product not found', 404);
    }

    return ApiResponse.success(data, 'Product retrieved successfully');
  } catch (error) {
    console.error('Get product by ID error:', error);
    return ApiResponse.error('Failed to retrieve product');
  }
};

export const deleteProduct = async (id, env) => {
  try {
    const supabase = createSupabaseClient(env);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return ApiResponse.success(null, 'Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    return ApiResponse.error('Failed to delete product');
  }
};
