import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: './.env' });

const debugUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user exists
    const user = await User.findOne({ email: 'test1@example.com' });
    
    if (user) {
      console.log('✅ User found:');
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Has Password: ${!!user.password}`);
      console.log(`   Password Length: ${user.password ? user.password.length : 0}`);
    } else {
      console.log('❌ User not found');
    }

    // Check all users in database
    const allUsers = await User.find({});
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('Users found:');
      allUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.email} (${u.name}) - Active: ${u.isActive}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error debugging user:', error);
    process.exit(1);
  }
};

debugUser();
