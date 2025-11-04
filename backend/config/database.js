// Import mongoose library for MongoDB connection
const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database
 * Uses connection string from environment variable MONGODB_URI
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Connect to MongoDB using connection string from environment variable
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Log success message with host information
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log error message
    console.error(`Error: ${error.message}`);
    
    // Exit process with failure code
    process.exit(1);
  }
};

// Export the connectDB function for use in other modules
module.exports = connectDB;
