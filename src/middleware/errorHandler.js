const { ApiResponse } = require('../utils/apiResponse');

exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  ApiResponse.error(res, 'Internal server error', 500);
};