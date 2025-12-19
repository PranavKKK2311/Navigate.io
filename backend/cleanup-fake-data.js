// Cleanup script to delete fake submissions and list assessments
const mongoose = require('mongoose');
require('dotenv').config();

const Submission = require('./models/Submission');
const Assessment = require('./models/Assessment');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/navigate');
        console.log('Connected to MongoDB');

        // Delete all submissions (they contain fake data)
        const deletedSubs = await Submission.deleteMany({});
        console.log(`Deleted ${deletedSubs.deletedCount} submissions`);

        // List all assessments
        const assessments = await Assessment.find({}).select('title courseId createdBy createdAt questions');
        console.log(`\nFound ${assessments.length} assessments:`);
        assessments.forEach((a, i) => {
            console.log(`${i + 1}. "${a.title}" - Course: ${a.courseId} - Questions: ${a.questions?.length || 0} - CreatedBy: ${a.createdBy || 'NOT SET'}`);
        });

        await mongoose.connection.close();
        console.log('\nDone! Fake submissions deleted.');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

cleanup();
