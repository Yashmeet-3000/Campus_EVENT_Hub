// Import required modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for campus event management system
 * Handles authentication and user profile information
 */
const userSchema = new mongoose.Schema({
  /**
   * User's full name
   * @type {String}
   * @required
   */
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  /**
   * User's email address
   * @type {String}
   * @required
   * @unique
   */
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },

  /**
   * User's hashed password
   * @type {String}
   * @required
   */
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },

  /**
   * URL to user's profile photo
   * @type {String}
   */
  photo_url: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },

  /**
   * User's contact phone number
   * @type {String}
   */
  phone: {
    type: String,
    match: [
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      'Please provide a valid phone number'
    ]
  },

  /**
   * Current year of study (1-5)
   * @type {Number}
   */
  year_of_study: {
    type: Number,
    min: [1, 'Year of study must be at least 1'],
    max: [5, 'Year of study cannot exceed 5']
  },

  /**
   * Academic branch/department
   * @type {String}
   */
  branch: {
    type: String,
    enum: {
      values: ['CSE', 'ECE', 'ME', 'CE', 'IT', 'Other'],
      message: '{VALUE} is not a valid branch'
    }
  },

  /**
   * User's role in the system
   * @type {String}
   * @required
   */
  role: {
    type: String,
    required: true,
    enum: {
      values: ['student', 'society_head', 'admin'],
      message: '{VALUE} is not a valid role'
    },
    default: 'student'
  },

  /**
   * Account status
   * @type {Boolean}
   */
  is_active: {
    type: Boolean,
    default: true
  },

  /**
   * Account creation timestamp
   * @type {Date}
   */
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Create index on email field for faster queries
userSchema.index({ email: 1 });

/**
 * Pre-save middleware to hash password before saving to database
 * Only hashes if password is modified
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare provided password with hashed password
 * Used during login authentication
 * @param {String} candidatePassword - Plain text password to compare
 * @returns {Promise<Boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Create and export User model
const User = mongoose.model('User', userSchema);

module.exports = User;
