// Import required modules
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * Extracts token from Authorization header and validates it
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
  try {
    // Step 1: Extract Authorization header from request
    const authHeader = req.headers['authorization'];
    
    // Step 2: Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Step 3: Extract token from "Bearer <token>" format
    // Split the header by space and take the second part (index 1)
    const token = authHeader.split(' ')[1];
    
    // Step 4: Check if token exists after splitting
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format. Expected "Bearer <token>".'
      });
    }
    
    // Step 5: Verify token using JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Step 6: Attach decoded user data to request object for use in routes
    // The decoded object should contain userId and any other data encoded in the token
    req.user = {
      userId: decoded.userId,
      role: decoded.role // Optional: include role if encoded in token
    };
    
    // Step 7: Call next() to proceed to the next middleware or route handler
    next();
    
  } catch (error) {
    // Step 8: Handle different types of JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token has expired.'
      });
    }
    
    // Handle any other unexpected errors
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Authorization middleware to check user role
 * Use this after authenticateToken to restrict access by role
 * 
 * @param {Array<String>} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists on request (should be set by authenticateToken)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    // User has required role, proceed
    next();
  };
};

// Export middleware functions
module.exports = {
  authenticateToken,
  authorizeRoles
};
