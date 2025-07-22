class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }
}

// Change to direct export
module.exports = ApiResponse;