const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
// Submission model was removed/merged into Assessment in previous steps, checking if it exists or if we need to clean raw collection
// Ideally we just drop the collections.

const resetDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        await User.deleteMany({});
        console.log('Deleted all Users.');

        await Course.deleteMany({});
        console.log('Deleted all Courses.');

        await Assessment.deleteMany({});
        console.log('Deleted all Assessments.');

        // Try to drop submissions collection if it exists remotely, purely via mongoose connection logic if model doesn't exist?
        // Safer to just delete from models we know. If Submission model file is gone, we might skip it or use mongoose.connection.db.dropCollection
        try {
            await mongoose.connection.db.dropCollection('submissions');
            console.log('Dropped submissions collection.');
        } catch (e) {
            console.log('No submissions collection to drop or error:', e.message);
        }

        console.log('Database reset complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDb();
