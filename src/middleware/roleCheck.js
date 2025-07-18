const { ApiResponse } = require('../utils/apiResponse');

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return ApiResponse.error(res, 'Admin access required', 403);
  }
  next();
};