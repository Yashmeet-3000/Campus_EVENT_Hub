// Import required modules from express-validator
const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Should be called after validation chains
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
      details: errors.array().map(err => `${err.path}: ${err.msg}`)
    });
  }
  
  next();
};

/**
 * Validation chain for user registration
 * Validates name, email, and password fields
 * 
 * @type {Array<ValidationChain>}
 */
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('year_of_study')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Year of study must be between 1 and 5'),
  
  body('branch')
    .optional()
    .isIn(['CSE', 'ECE', 'ME', 'CE', 'IT', 'Other'])
    .withMessage('Invalid branch'),
  
  body('role')
    .optional()
    .isIn(['student', 'society_head', 'admin'])
    .withMessage('Invalid role'),
  
  handleValidationErrors
];

/**
 * Validation chain for user login
 * Validates email and password fields
 * 
 * @type {Array<ValidationChain>}
 */
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  handleValidationErrors
];

/**
 * Validation chain for event creation
 * Validates all required event fields
 * 
 * @type {Array<ValidationChain>}
 */
const validateEventCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('event_type')
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(['workshop', 'seminar', 'competition', 'cultural', 'sports', 'orientation', 'hackathon'])
    .withMessage('Invalid event type'),
  
  body('start_datetime')
    .notEmpty()
    .withMessage('Event start date and time is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO 8601 date format'),
  
  body('end_datetime')
    .notEmpty()
    .withMessage('Event end date and time is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO 8601 date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_datetime)) {
        throw new Error('Event end datetime must be after start datetime');
      }
      return true;
    }),
  
  body('venue')
    .trim()
    .notEmpty()
    .withMessage('Event venue is required')
    .isLength({ max: 100 })
    .withMessage('Venue cannot exceed 100 characters'),
  
  body('registration_mode')
    .optional()
    .isIn(['individual', 'team'])
    .withMessage('Registration mode must be either "individual" or "team"'),
  
  body('min_team_size')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum team size must be at least 1'),
  
  body('max_team_size')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum team size must be at least 1')
    .custom((value, { req }) => {
      if (req.body.min_team_size && value < parseInt(req.body.min_team_size)) {
        throw new Error('Maximum team size must be greater than or equal to minimum team size');
      }
      return true;
    }),
  
  body('registration_start_datetime')
    .notEmpty()
    .withMessage('Registration start date and time is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO 8601 date format'),
  
  body('registration_end_datetime')
    .notEmpty()
    .withMessage('Registration end date and time is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO 8601 date format')
    .custom((value, { req }) => {
      if (new Date(value) >= new Date(req.body.start_datetime)) {
        throw new Error('Registration end datetime must be before event start datetime');
      }
      return true;
    }),
  
  body('max_teams')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum teams must be at least 1'),
  
  body('society_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid society ID'),
  
  handleValidationErrors
];

/**
 * Validation chain for event update
 * Similar to creation but fields are optional
 * 
 * @type {Array<ValidationChain>}
 */
const validateEventUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('venue')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Venue cannot exceed 100 characters'),
  
  body('event_status')
    .optional()
    .isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid event status'),
  
  body('poster_url')
    .optional()
    .isURL()
    .withMessage('Invalid poster URL'),
  
  handleValidationErrors
];

/**
 * Validation chain for event registration
 * Validates registration data
 * 
 * @type {Array<ValidationChain>}
 */
const validateRegistration = [
  body('event_id')
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  body('team_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Team name cannot exceed 100 characters'),
  
  body('team_members')
    .optional()
    .isArray()
    .withMessage('Team members must be an array'),
  
  body('team_members.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid team member user ID'),
  
  body('form_answers')
    .optional()
    .isArray()
    .withMessage('Form answers must be an array'),
  
  handleValidationErrors
];

// Export all validation chains
module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateEventCreation,
  validateEventUpdate,
  validateRegistration,
  handleValidationErrors
};
