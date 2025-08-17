class ApiResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return new Response(JSON.stringify({
      success: true,
      message,
      data
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  static error(message = 'An error occurred', statusCode = 500, errors = null) {
    return new Response(JSON.stringify({
      success: false,
      message,
      errors
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export { ApiResponse };