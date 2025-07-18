const { supabase } = require('../models/supabaseModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ApiResponse } = require('../utils/apiResponse');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return ApiResponse.success(res, {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error(res, 'Internal server error');
  }
};