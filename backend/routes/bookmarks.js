// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Event = require('../models/Event');
const { authenticateToken } = require('../middleware/auth');

// Create router instance
const router = express.Router();

/**
 * @route   POST /api/bookmarks
 * @desc    Bookmark an event
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id } = req.body;
    const userId = req.user.userId;
    
    // Validate event_id
    if (!event_id || !mongoose.isValidObjectId(event_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid event ID is required'
      });
    }
    
    // Check if event exists
    const event = await Event.findById(event_id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      user_id: userId,
      event_id: event_id
    });
    
    if (existingBookmark) {
      return res.status(409).json({
        success: false,
        message: 'Event already bookmarked'
      });
    }
    
    // Create bookmark
    const bookmark = await Bookmark.create({
      user_id: userId,
      event_id: event_id
    });
    
    // Populate event details
    await bookmark.populate('event_id', 'title event_type start_datetime venue poster_url');
    
    return res.status(201).json({
      success: true,
      message: 'Event bookmarked successfully',
      bookmark
    });
    
  } catch (error) {
    console.error('Bookmark event error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while bookmarking event'
    });
  }
});

/**
 * @route   GET /api/bookmarks
 * @desc    Get user's bookmarked events
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all bookmarks for user
    const bookmarks = await Bookmark.find({ user_id: userId })
      .populate('event_id', 'title description event_type start_datetime end_datetime venue poster_url registration_end_datetime')
      .sort({ created_at: -1 });
    
    return res.status(200).json({
      success: true,
      bookmarks,
      count: bookmarks.length
    });
    
  } catch (error) {
    console.error('Get bookmarks error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching bookmarks'
    });
  }
});

/**
 * @route   DELETE /api/bookmarks/:eventId
 * @desc    Remove bookmark from an event
 * @access  Private
 */
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;
    
    // Validate event_id
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    // Find and delete bookmark
    const bookmark = await Bookmark.findOneAndDelete({
      user_id: userId,
      event_id: eventId
    });
    
    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully'
    });
    
  } catch (error) {
    console.error('Remove bookmark error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while removing bookmark'
    });
  }
});

/**
 * @route   GET /api/bookmarks/check/:eventId
 * @desc    Check if event is bookmarked by user
 * @access  Private
 */
router.get('/check/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;
    
    // Validate event_id
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    // Check if bookmarked
    const bookmark = await Bookmark.findOne({
      user_id: userId,
      event_id: eventId
    });
    
    return res.status(200).json({
      success: true,
      isBookmarked: !!bookmark
    });
    
  } catch (error) {
    console.error('Check bookmark error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while checking bookmark'
    });
  }
});

// Export router
module.exports = router;
