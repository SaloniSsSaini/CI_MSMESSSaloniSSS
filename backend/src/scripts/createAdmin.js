const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-intelligence');
        console.log('Connected to MongoDB');

        // Check if admin already exists and delete if so
        const existingAdmin = await User.findOne({ email: 'admin@carbonintel.com' });

        if (existingAdmin) {
            console.log('Found existing admin user, deleting...');
            await User.deleteOne({ email: 'admin@carbonintel.com' });
            console.log('Existing admin user deleted.');
        }

        // Create admin user with proper role
        const admin = new User({
            email: 'admin@carbonintel.com',
            password: 'Admin@123',  // Will be hashed by the model's pre-save hook
            role: 'admin', // Correctly assign the role
            profile: {
                firstName: 'System',
                lastName: 'Administrator'
            },
            isActive: true
        });

        await admin.save();

        console.log('✅ Admin user created successfully!');
        console.log('-----------------------------------');
        console.log('Email:', admin.email);
        console.log('Password: Admin@123');
        console.log('Role:', admin.role); // Should now show 'admin'
        console.log('-----------------------------------');
        console.log('⚠️  IMPORTANT: Change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
