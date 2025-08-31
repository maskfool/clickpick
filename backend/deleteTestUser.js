import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: './.env' });

const deleteTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete test user
    const result = await User.deleteOne({ email: 'test1@example.com' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Test user deleted successfully');
    } else {
      console.log('ℹ️  Test user not found to delete');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting test user:', error);
    process.exit(1);
  }
};

deleteTestUser();
