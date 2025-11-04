// Import required modules
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Form Field Subdocument Schema
 * Defines dynamic registration form fields for events
 */
const formFieldSchema = new mongoose.Schema({
  /**
   * Unique identifier for the form field
   * @type {String}
   */
  field_id: {
    type: String,
    default: () => uuidv4()
  },

  /**
   * Display label for the form field
   * @type {String}
   * @required
   */
  label: {
    type: String,
    required: [true, 'Field label is required'],
    maxlength: [100, 'Label cannot exceed 100 characters']
  },

  /**
   * Type of input field
   * @type {String}
   * @required
   */
  field_type: {
    type: String,
    required: [true, 'Field type is required'],
    enum: {
      values: ['short_text', 'long_text', 'number', 'email', 'phone', 'select', 'multi_select', 'date', 'file', 'url'],
      message: '{VALUE} is not a valid field type'
    }
  },

  /**
   * Whether the field is mandatory
   * @type {Boolean}
   */
  is_required: {
    type: Boolean,
    default: true
  },

  /**
   * Options for select/multi_select field types
   * @type {Array<String>}
   */
  options: {
    type: [String],
    default: undefined
  },

  /**
   * Order of field in the form
   * @type {Number}
   * @required
   */
  order_index: {
    type: Number,
    required: [true, 'Order index is required']
  }
}, { _id: false });

/**
 * Event Schema for campus event management system
 * Represents events organized by societies
 */
const eventSchema = new mongoose.Schema({
  /**
   * Event title
   * @type {String}
   * @required
   */
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  /**
   * Event description
   * @type {String}
   * @required
   */
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
    minlength: [10, 'Description must be at least 10 characters']
  },

  /**
   * Category of event
   * @type {String}
   * @required
   */
  event_type: {
    type: String,
    required: [true, 'Please provide an event type'],
    enum: {
      values: ['workshop', 'seminar', 'competition', 'cultural', 'sports', 'orientation', 'hackathon'],
      message: '{VALUE} is not a valid event type'
    }
  },

  /**
   * Event start date and time
   * @type {Date}
   * @required
   */
  start_datetime: {
    type: Date,
    required: [true, 'Please provide event start datetime'],
    validate: {
      validator: function(value) {
        // Validate that start_datetime is in the future
        return value > new Date();
      },
      message: 'Event start datetime must be in the future'
    }
  },

  /**
   * Event end date and time
   * @type {Date}
   * @required
   */
  end_datetime: {
    type: Date,
    required: [true, 'Please provide event end datetime'],
    validate: {
      validator: function(value) {
        // Validate that end_datetime is after start_datetime
        return value > this.start_datetime;
      },
      message: 'Event end datetime must be after start datetime'
    }
  },

  /**
   * Event venue/location
   * @type {String}
   * @required
   */
  venue: {
    type: String,
    required: [true, 'Please provide event venue'],
    maxlength: [100, 'Venue cannot exceed 100 characters']
  },

  /**
   * URL to event poster image
   * @type {String}
   */
  poster_url: {
    type: String
  },

  /**
   * Maximum number of teams allowed
   * @type {Number}
   */
  max_teams: {
    type: Number,
    min: [1, 'Maximum teams must be at least 1']
  },

  /**
   * Whether registration is currently open
   * @type {Boolean}
   */
  registration_open: {
    type: Boolean,
    default: true
  },

  /**
   * Registration mode (individual or team)
   * @type {String}
   * @required
   */
  registration_mode: {
    type: String,
    required: [true, 'Please provide registration mode'],
    enum: {
      values: ['individual', 'team'],
      message: '{VALUE} is not a valid registration mode'
    },
    default: 'individual'
  },

  /**
   * Minimum team size (for team events)
   * @type {Number}
   */
  min_team_size: {
    type: Number,
    default: 1,
    min: [1, 'Minimum team size must be at least 1']
  },

  /**
   * Maximum team size (for team events)
   * @type {Number}
   */
  max_team_size: {
    type: Number,
    default: 1,
    min: [1, 'Maximum team size must be at least 1'],
    validate: {
      validator: function(value) {
        // Validate that max_team_size is >= min_team_size
        return value >= this.min_team_size;
      },
      message: 'Maximum team size must be greater than or equal to minimum team size'
    }
  },

  /**
   * Registration start date and time
   * @type {Date}
   * @required
   */
  registration_start_datetime: {
    type: Date,
    required: [true, 'Please provide registration start datetime']
  },

  /**
   * Registration end date and time
   * @type {Date}
   * @required
   */
  registration_end_datetime: {
    type: Date,
    required: [true, 'Please provide registration end datetime'],
    validate: {
      validator: function(value) {
        // Validate that registration ends before event starts
        return value < this.start_datetime;
      },
      message: 'Registration end datetime must be before event start datetime'
    }
  },

  /**
   * Reference to organizing society
   * @type {ObjectId}
   * @ref Society
   */
  society_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },

  /**
   * Reference to event organizer
   * @type {ObjectId}
   * @required
   * @ref User
   */
  organizer_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Please provide an organizer'],
    ref: 'User'
  },

  /**
   * Current status of event
   * @type {String}
   */
  event_status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid event status'
    },
    default: 'draft'
  },

  /**
   * Dynamic form fields for registration
   * @type {Array<FormField>}
   */
  form_fields: {
    type: [formFieldSchema],
    default: []
  },

  /**
   * Event creation timestamp
   * @type {Date}
   */
  created_at: {
    type: Date,
    default: Date.now
  },

  /**
   * Event last update timestamp
   * @type {Date}
   */
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
eventSchema.index({ event_type: 1, event_status: 1, start_datetime: 1 });
eventSchema.index({ society_id: 1, event_status: 1 });

/**
 * Pre-save middleware to auto-generate field_id for form fields
 * Ensures each form field has a unique identifier
 */
eventSchema.pre('save', function(next) {
  // Generate field_id for any form fields that don't have one
  if (this.form_fields && this.form_fields.length > 0) {
    this.form_fields.forEach(field => {
      if (!field.field_id) {
        field.field_id = uuidv4();
      }
    });
  }
  
  // Update the updated_at timestamp
  this.updated_at = Date.now();
  
  next();
});

// Create and export Event model
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
