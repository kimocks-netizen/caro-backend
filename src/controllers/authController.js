// Import required dependencies at the top of the file
const { supabase } = require('../models/supabaseModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ApiResponse } = require('../utils/apiResponse');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};