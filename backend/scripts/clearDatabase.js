const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user_registration');
    console.log('✅ Connected to MongoDB');

    // Get the User model
    const User = require('../models/User');
    
    // Delete ALL users
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users from database`);
    
    // Drop the entire database (optional - more thorough)
    // await mongoose.connection.dropDatabase();
    // console.log('✅ Database dropped completely');
    
    console.log('🎉 Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

clearDatabase();