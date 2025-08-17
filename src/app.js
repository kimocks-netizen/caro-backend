// Cloudflare Worker entry point
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return handleCORS(new Response(null, { status: 200 }));
      }

      // Route handling
      if (path.startsWith('/api/auth')) {
        return await handleAuthRoutes(request, env, path);
      } else if (path.startsWith('/api/products')) {
        return await handleProductRoutes(request, env, path);
      } else if (path.startsWith('/api/quotes')) {
        return await handleQuoteRoutes(request, env, path);
      } else if (path.startsWith('/api/verify')) {
        return await handleVerificationRoutes(request, env, path);
      }

      // Default response
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

// CORS handler
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Auth routes handler
async function handleAuthRoutes(request, env, path) {
  // Import auth controller functions
  const { login, register, verifyToken } = await import('./controllers/authController.js');
  
  if (path === '/api/auth/login' && request.method === 'POST') {
    const body = await request.json();
    return await login(body, env);
  } else if (path === '/api/auth/register' && request.method === 'POST') {
    const body = await request.json();
    return await register(body, env);
  } else if (path === '/api/auth/verify' && request.method === 'POST') {
    const body = await request.json();
    return await verifyToken(body, env);
  }
  
  return new Response('Not Found', { status: 404 });
}

// Product routes handler
async function handleProductRoutes(request, env, path) {
  // Import product controller functions
  const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = await import('./controllers/productController.js');
  
  if (path === '/api/products' && request.method === 'GET') {
    return await getAllProducts(env);
  } else if (path.match(/^\/api\/products\/\d+$/) && request.method === 'GET') {
    const id = path.split('/').pop();
    return await getProductById(id, env);
  } else if (path === '/api/products' && request.method === 'POST') {
    const body = await request.json();
    return await createProduct(body, env);
  } else if (path.match(/^\/api\/products\/\d+$/) && request.method === 'PUT') {
    const id = path.split('/').pop();
    const body = await request.json();
    return await updateProduct(id, body, env);
  } else if (path.match(/^\/api\/products\/\d+$/) && request.method === 'DELETE') {
    const id = path.split('/').pop();
    return await deleteProduct(id, env);
  }
  
  return new Response('Not Found', { status: 404 });
}

// Quote routes handler
async function handleQuoteRoutes(request, env, path) {
  // Import quote controller functions
  const { createQuote, getQuoteById, getAllQuotes, updateQuoteStatus } = await import('./controllers/quoteController.js');
  
  if (path === '/api/quotes' && request.method === 'POST') {
    const body = await request.json();
    return await createQuote(body, env);
  } else if (path.match(/^\/api\/quotes\/\d+$/) && request.method === 'GET') {
    const id = path.split('/').pop();
    return await getQuoteById(id, env);
  } else if (path === '/api/quotes' && request.method === 'GET') {
    return await getAllQuotes(env);
  } else if (path.match(/^\/api\/quotes\/\d+\/status$/) && request.method === 'PUT') {
    const id = path.split('/')[3];
    const body = await request.json();
    return await updateQuoteStatus(id, body, env);
  }
  
  return new Response('Not Found', { status: 404 });
}

// Verification routes handler
async function handleVerificationRoutes(request, env, path) {
  // Import verification controller functions
  const { verifyEmail, resendVerification } = await import('./controllers/verificationController.js');
  
  if (path === '/api/verify/email' && request.method === 'POST') {
    const body = await request.json();
    return await verifyEmail(body, env);
  } else if (path === '/api/verify/resend' && request.method === 'POST') {
    const body = await request.json();
    return await resendVerification(body, env);
  }
  
  return new Response('Not Found', { status: 404 });
}