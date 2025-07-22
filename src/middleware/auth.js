// In auth.js
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return ApiResponse.error(res, 'Authentication token required', 401);

    // Verify using your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin exists
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      return ApiResponse.error(res, 'Invalid authentication token', 401);
    }

    req.user = { 
      id: admin.id, 
      email: admin.email, 
      role: 'admin' // Your system uses fixed admin role
    };
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