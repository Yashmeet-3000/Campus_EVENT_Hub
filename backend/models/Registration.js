// Import mongoose
const mongoose = require('mongoose');

/**
 * Members Subdocument Schema
 * Represents team members in a team registration
 */
const memberSchema = new mongoose.Schema({
  /**
   * Reference to User who is a team member
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
   * Role of member in the team
   * @type {String}
   */
  role: {
    type: String,
    enum: {
      values: ['leader', 'member'],
      message: '{VALUE} is not a valid role'
    },
    default: 'member'
  },

  /**
   * Status of team invitation
   * @type {String}
   */
  invite_status: {
    type: String,
    enum: {
      values: ['auto_added', 'invited', 'accepted', 'declined'],
      message: '{VALUE} is not a valid invite status'
    },
    default: 'auto_added'
  },

  /**
   * Timestamp when member was added
   * @type {Date}
   */
  added_at: {
    type: Date,
    default: Date.now
  },

  /**
   * Timestamp when member responded to invitation
   * @type {Date}
   */
  responded_at: {
    type: Date
  }
}, { _id: false });

/**
 * Answers Subdocument Schema
 * Stores responses to dynamic form fields
 */
const answerSchema = new mongoose.Schema({
  /**
   * ID of the form field (from Event.form_fields)
   * @type {String}
   * @required
   */
  field_id: {
    type: String,
    required: [true, 'Field ID is required']
  },

  /**
   * Label of the form field
   * @type {String}
   * @required
   */
  field_label: {
    type: String,
    required: [true, 'Field label is required']
  },

  /**
   * Text answer value
   * @type {String}
   */
  value_text: {
    type: String
  },

  /**
   * Numeric answer value
   * @type {Number}
   */
  value_number: {
    type: Number
  },

  /**
   * Date answer value
   * @type {Date}
   */
  value_date: {
    type: Date
  }
}, { _id: false });

/**
 * Registration Schema for campus event management system
 * Handles both individual and team-based event registrations
 */
const registrationSchema = new mongoose.Schema({
  /**
   * Reference to Event being registered for
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
   * Registration mode (individual or team)
   * @type {String}
   * @required
   */
  mode: {
    type: String,
    required: [true, 'Registration mode is required'],
    enum: {
      values: ['individual', 'team'],
      message: '{VALUE} is not a valid registration mode'
    }
  },

  /**
   * Reference to User who is the team leader or individual registrant
   * @type {ObjectId}
   * @required
   * @ref User
   */
  leader_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Leader user ID is required'],
    ref: 'User'
  },

  /**
   * Name of the team (required for team registrations)
   * @type {String}
   */
  team_name: {
    type: String,
    maxlength: [100, 'Team name cannot exceed 100 characters'],
    validate: {
      validator: function(value) {
        // Team name is required when mode is 'team'
        if (this.mode === 'team') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'Team name is required for team registrations'
    }
  },

  /**
   * Current status of registration
   * @type {String}
   */
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },

  /**
   * Team members (for team registrations)
   * @type {Array<Member>}
   */
  members: {
    type: [memberSchema],
    default: []
  },

  /**
   * Registration form answers
   * @type {Array<Answer>}
   */
  answers: {
    type: [answerSchema],
    default: []
  },

  /**
   * Registration creation timestamp
   * @type {Date}
   */
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound unique index to prevent duplicate registrations
registrationSchema.index({ event_id: 1, leader_user_id: 1 }, { unique: true });

// Create indexes for efficient queries
registrationSchema.index({ event_id: 1, status: 1 });
registrationSchema.index({ leader_user_id: 1 });

/**
 * Pre-save validation for team size
 * Validates team member count against event requirements
 */
registrationSchema.pre('save', async function(next) {
  try {
    // Only validate team size for team registrations
    if (this.mode === 'team' && this.isModified('members')) {
      // Fetch the event to get team size constraints
      const Event = mongoose.model('Event');
      const event = await Event.findById(this.event_id);
      
      if (event) {
        const memberCount = this.members.length;
        
        // Validate minimum team size
        if (memberCount < event.min_team_size) {
          return next(new Error(`Team must have at least ${event.min_team_size} members`));
        }
        
        // Validate maximum team size
        if (memberCount > event.max_team_size) {
          return next(new Error(`Team cannot have more than ${event.max_team_size} members`));
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Create and export Registration model
const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
