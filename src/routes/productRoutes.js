const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadMiddleware,
} = require('../controllers/productController');

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin protected routes with upload middleware only on POST
router.post('/', authenticate, adminOnly, uploadMiddleware, createProduct);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, deleteProduct);

module.exports = router;
