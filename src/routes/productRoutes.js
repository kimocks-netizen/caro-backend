// src/routes/productRoutes.js
const express = require('express');
const { 
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage 
} = require('../controllers/productController');
const { authenticate, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin protected routes
router.post('/', authenticate, adminOnly, createProduct);
router.post('/upload', authenticate, adminOnly, upload.single('image'), uploadImage);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, deleteProduct);

module.exports = router;