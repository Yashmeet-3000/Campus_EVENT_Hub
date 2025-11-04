// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Society = require('../models/Society');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateEventCreation, validateEventUpdate } = require('../middleware/validation');

// Create router instance
const router = express.Router();

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private (society_head, admin)
 */
router.post('/', authenticateToken, authorizeRoles('society_head', 'admin'), validateEventCreation, async (req, res) => {
  try {
    const {
      title,
      description,
      event_type,
      start_datetime,
      end_datetime,
      venue,
      society_id,
      registration_mode,
      min_team_size,
      max_team_size,
      registration_start_datetime,
      registration_end_datetime,
      max_teams,
      poster_url,
      form_fields
    } = req.body;
    
    // If society_id provided, verify society exists and user is head
    if (society_id) {
      const society = await Society.findById(society_id);
      
      if (!society) {
        return res.status(404).json({
          success: false,
          message: 'Society not found'
        });
      }
      
      // Check if user is head of this society (unless admin)
      if (req.user.role !== 'admin' && society.head_id.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to create events for this society'
        });
      }
    }
    
    // Create event object
    const eventData = {
      title,
      description,
      event_type,
      start_datetime,
      end_datetime,
      venue,
      organizer_id: req.user.userId,
      registration_start_datetime,
      registration_end_datetime,
      event_status: req.body.event_status || 'draft' // Use provided status or default to draft
    };
    
    // Add optional fields
    if (society_id) eventData.society_id = society_id;
    if (registration_mode) eventData.registration_mode = registration_mode;
    if (min_team_size) eventData.min_team_size = min_team_size;
    if (max_team_size) eventData.max_team_size = max_team_size;
    if (max_teams) eventData.max_teams = max_teams;
    if (poster_url) eventData.poster_url = poster_url;
    if (form_fields) eventData.form_fields = form_fields;
    
    // Create event in database
    const event = await Event.create(eventData);
    
    // Populate organizer and society details
    await event.populate('organizer_id', 'name email');
    if (society_id) {
      await event.populate('society_id', 'name logo_url');
    }
    
    console.log(`Event created: ${event.title} by ${req.user.userId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
    
  } catch (error) {
    console.error('Create event error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

/**
 * @route   GET /api/events/my-events
 * @desc    Get events created by current user (society head's events)
 * @access  Private
 */
router.get('/my-events', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ organizer_id: req.user.userId })
      .populate('society_id', 'name logo_url')
      .sort({ created_at: -1 });
    
    return res.status(200).json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Get my events error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events
 * @desc    Get all events with filters and pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      event_type,
      event_status,
      society_id,
      skip = 0,
      limit = 20
    } = req.query;
    
    // Build query filter
    const filter = {};
    
    // Add filters if provided
    if (event_type) filter.event_type = event_type;
    if (society_id && mongoose.isValidObjectId(society_id)) {
      filter.society_id = society_id;
    }
    
    // For non-authenticated requests, only show published/ongoing events
    // For authenticated requests, check if user is organizer
    if (!req.user) {
      filter.event_status = { $in: ['published', 'ongoing'] };
    } else if (event_status) {
      filter.event_status = event_status;
    } else {
      // Show published/ongoing events plus user's own drafts
      filter.$or = [
        { event_status: { $in: ['published', 'ongoing'] } },
        { organizer_id: req.user.userId }
      ];
    }
    
    // Get total count for pagination
    const totalCount = await Event.countDocuments(filter);
    
    // Fetch events with pagination and sorting
    const events = await Event.find(filter)
      .populate('society_id', 'name logo_url')
      .populate('organizer_id', 'name email')
      .sort({ start_datetime: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      count: events.length,
      total: totalCount,
      events
    });
    
  } catch (error) {
    console.error('Get events error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

/**
 * @route   GET /api/events/:eventId
 * @desc    Get single event by ID
 * @access  Public
 */
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    // Find event and populate references
    const event = await Event.findById(eventId)
      .populate('society_id', 'name description logo_url contact_email')
      .populate('organizer_id', 'name email phone');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user can view draft events
    if (event.event_status === 'draft') {
      if (!req.user || (req.user.userId !== event.organizer_id._id.toString() && req.user.role !== 'admin')) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      event
    });
    
  } catch (error) {
    console.error('Get event error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

/**
 * @route   PUT /api/events/:eventId
 * @desc    Update an event
 * @access  Private (organizer, admin)
 */
router.put('/:eventId', authenticateToken, validateEventUpdate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    // Find event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization (organizer or admin)
    if (event.organizer_id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event'
      });
    }
    
    // Prevent changing certain fields if event is published
    if (event.event_status === 'published' || event.event_status === 'ongoing') {
      if (req.body.event_type && req.body.event_type !== event.event_type) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change event type after publication'
        });
      }
      
      if (req.body.organizer_id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change organizer after publication'
        });
      }
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'venue',
      'poster_url',
      'event_status',
      'start_datetime',
      'end_datetime',
      'registration_start_datetime',
      'registration_end_datetime',
      'max_teams',
      'registration_open'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });
    
    // Save updated event
    await event.save();
    
    console.log(`Event updated: ${event.title} by ${req.user.userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
    
  } catch (error) {
    console.error('Update event error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
});

/**
 * @route   DELETE /api/events/:eventId
 * @desc    Soft delete event (set status to cancelled)
 * @access  Private (organizer, admin)
 */
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    // Find event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization (organizer or admin)
    if (event.organizer_id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this event'
      });
    }
    
    // Soft delete by setting status to cancelled
    event.event_status = 'cancelled';
    await event.save();
    
    console.log(`Event cancelled: ${event.title} by ${req.user.userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Event cancelled successfully'
    });
    
  } catch (error) {
    console.error('Delete event error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
});

/**
 * @route   GET /api/events/:eventId/form-fields
 * @desc    Get form field definitions for an event
 * @access  Public
 */
router.get('/:eventId/form-fields', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }
    
    // Find event
    const event = await Event.findById(eventId).select('form_fields title');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      event_title: event.title,
      form_fields: event.form_fields || []
    });
    
  } catch (error) {
    console.error('Get form fields error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching form fields'
    });
  }
});

// Export router
module.exports = router;
