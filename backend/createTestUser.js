import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: './.env' });

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test1@example.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      process.exit(0);
    }

    // Create test user (password will be hashed by the User model pre-save hook)
    const testUser = await User.create({
      name: 'Test User',
      email: 'test1@example.com',
      password: 's2ecret123',
      role: 'user',
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en'
      },
      stats: {
        thumbnailsCreated: 0,
        imagesGenerated: 0,
        totalUsage: 0
      }
    });

    console.log('✅ Test user created successfully:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: s2ecret123`);
    console.log(`   ID: ${testUser._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
