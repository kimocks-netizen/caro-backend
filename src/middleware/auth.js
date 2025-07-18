const jwt = require('jsonwebtoken');
const { supabase } = require('../models/supabaseModel');
const { ApiResponse } = require('../utils/apiResponse');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return ApiResponse.error(res, 'Authentication token required', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return ApiResponse.error(res, 'Invalid authentication token', 401);

    req.user = { id: user.id, email: user.email, role: user.role || 'admin' };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return ApiResponse.error(res, 'Invalid or expired token', 401);
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Admin privileges required', 403);
  }
  next();
};