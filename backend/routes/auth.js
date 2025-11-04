// Import required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

// Create router instance
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, phone, year_of_study, branch, role } = req.body;
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email or login.'
      });
    }
    
    // Create new user object
    const userData = {
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: role || 'student'
    };
    
    // Add optional fields if provided
    if (phone) userData.phone = phone;
    if (year_of_study) userData.year_of_study = year_of_study;
    if (branch) userData.branch = branch;
    
    // Create user in database
    const user = await User.create(userData);
    
    // Log registration
    console.log(`New user registered: ${user.email} (${user.role})`);
    
    // Return success response without password
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error.message);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later.'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }
    
    // Verify password using comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token with 24 hour expiration
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );
    
    // Log successful login
    console.log(`User logged in: ${user.email}`);
    
    // Return token and user data
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
});

/**
 * @route   GET /api/auth/search
 * @desc    Search users by name or email (for team formation)
 * @access  Private (requires authentication)
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // Search users by name or email (case-insensitive)
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        { is_active: true },
        { _id: { $ne: req.user.userId } } // Exclude current user
      ]
    })
    .select('name email')
    .limit(10);
    
    return res.status(200).json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error('User search error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user.userId is set by authenticateToken middleware
    const user = await User.findById(req.user.userId).select('-password');
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user profile
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo_url: user.photo_url,
        year_of_study: user.year_of_study,
        branch: user.branch,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile. Please try again later.'
    });
  }
});

// Export router
module.exports = router;
