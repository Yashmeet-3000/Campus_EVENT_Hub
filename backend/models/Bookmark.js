// Import mongoose
const mongoose = require('mongoose');

/**
 * Bookmark Schema for campus event management system
 * Represents user bookmarks/saved events
 * Simple many-to-many relationship between users and events
 */
const bookmarkSchema = new mongoose.Schema({
  /**
   * Reference to User who bookmarked the event
   * @type {ObjectId}
   * @required
   * @ref User
   */
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User'
  },

  /**
   * Reference to Event being bookmarked
   * @type {ObjectId}
   * @required
   * @ref Event
   */
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Event ID is required'],
    ref: 'Event'
  },

  /**
   * Bookmark creation timestamp
   * @type {Date}
   */
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound unique index to prevent duplicate bookmarks
bookmarkSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

// Create index on user_id for fast user bookmark queries
bookmarkSchema.index({ user_id: 1 });

// Create and export Bookmark model
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
