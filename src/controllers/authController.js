import { createSupabaseClient } from '../models/supabaseModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/apiResponse.js';

export const login = async (body, env) => {
  const { email, password } = body;

  try {
    const supabase = createSupabaseClient(env);
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return ApiResponse.error('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return ApiResponse.error('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return ApiResponse.success({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error('Internal server error');
  }
};

export const register = async (body, env) => {
  const { email, password, name } = body;

  try {
    const supabase = createSupabaseClient(env);
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return ApiResponse.error('Admin already exists', 400);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const { data: newAdmin, error } = await supabase
      .from('admins')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return ApiResponse.error('Failed to create admin account');
    }

    return ApiResponse.success({
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return ApiResponse.error('Internal server error');
  }
};

export const verifyToken = async (body, env) => {
  const { token } = body;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    const supabase = createSupabaseClient(env);
    // Get admin info
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, name')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      return ApiResponse.error('Invalid token', 401);
    }

    return ApiResponse.success({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return ApiResponse.error('Invalid token', 401);
  }
};