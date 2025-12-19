// Script to list and optionally delete duplicate assessments
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/navigate');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Define Assessment schema (minimal)
const assessmentSchema = new mongoose.Schema({
    title: String,
    description: String,
    isPublished: Boolean,
    createdAt: Date,
    updatedAt: Date
}, { collection: 'assessments', strict: false });

const Assessment = mongoose.model('Assessment', assessmentSchema);

const run = async () => {
    await connectDB();

    // List all assessments
    const assessments = await Assessment.find({}).sort({ createdAt: -1 });

    console.log('\n=== ALL ASSESSMENTS ===');
    console.log(`Total: ${assessments.length}`);

    assessments.forEach((a, i) => {
        console.log(`\n${i + 1}. ID: ${a._id}`);
        console.log(`   Title: ${a.title}`);
        console.log(`   Published: ${a.isPublished}`);
        console.log(`   Created: ${a.createdAt}`);

        // Show questions
        if (a.questions && a.questions.length > 0) {
            console.log(`   Questions: ${a.questions.length}`);
            a.questions.slice(0, 3).forEach((q, j) => {
                console.log(`     Q${j + 1}: ${JSON.stringify(q).substring(0, 150)}...`);
            });
        } else {
            console.log('   Questions: NONE or empty');
        }
    });

    // Check for duplicates by keeping only the most recent
    if (process.argv.includes('--clean')) {
        console.log('\n=== CLEANING DUPLICATES ===');

        // Keep only the most recent published assessment
        const publishedAssessments = assessments.filter(a => a.isPublished);

        if (publishedAssessments.length > 1) {
            // Keep the first one (most recent due to sort), delete the rest
            const toDelete = publishedAssessments.slice(1);

            for (const a of toDelete) {
                console.log(`Deleting duplicate: ${a.title} (ID: ${a._id})`);
                await Assessment.deleteOne({ _id: a._id });
            }

            console.log(`Deleted ${toDelete.length} duplicate assessments`);
        } else {
            console.log('No duplicates found to clean');
        }
    } else {
        console.log('\nTo clean duplicates, run: node cleanup-assessments.js --clean');
    }

    mongoose.connection.close();
};

run().catch(console.error);
