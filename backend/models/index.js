// Export all models from a single file for easy importing
const User = require('./User');
const Society = require('./Society');
const Event = require('./Event');
const Registration = require('./Registration');
const Bookmark = require('./Bookmark');

module.exports = {
  User,
  Society,
  Event,
  Registration,
  Bookmark
};
