const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Range',
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: [
    'Content-Range',
    'Content-Length',
    'Content-Disposition',
    'X-Total-Count',
    'Authorization'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours for preflight cache
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/verify', verificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});