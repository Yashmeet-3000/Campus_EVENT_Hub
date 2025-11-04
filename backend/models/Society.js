// Import mongoose
const mongoose = require('mongoose');

/**
 * Society/Club Schema for campus event management system
 * Represents student organizations that organize events
 */
const societySchema = new mongoose.Schema({
  /**
   * Society name
   * @type {String}
   * @required
   * @unique
   */
  name: {
    type: String,
    required: [true, 'Please provide a society name'],
    unique: true,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  /**
   * Society description
   * @type {String}
   */
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  /**
   * Reference to User who heads the society
   * @type {ObjectId}
   * @required
   * @ref User
   */
  head_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Please provide a society head'],
    ref: 'User'
  },

  /**
   * Society contact email
   * @type {String}
   * @required
   */
  contact_email: {
    type: String,
    required: [true, 'Please provide a contact email'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },

  /**
   * URL to society logo
   * @type {String}
   */
  logo_url: {
    type: String
  },

  /**
   * Society active status
   * @type {Boolean}
   */
  is_active: {
    type: Boolean,
    default: true
  },

  /**
   * Society creation timestamp
   * @type {Date}
   */
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index on name and is_active for efficient queries
societySchema.index({ name: 1, is_active: 1 });

// Create and export Society model
const Society = mongoose.model('Society', societySchema);

module.exports = Society;
