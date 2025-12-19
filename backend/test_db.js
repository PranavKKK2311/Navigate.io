require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = process.env.MONGODB_URI;

console.log('--- MongoDB Connection Test ---');
console.log(`URI found: ${uri ? 'YES' : 'NO'}`);
if (uri) {
    const masked = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`Target: ${masked}`);
}

async function testConnection() {
    try {
        console.log('Attempting to connect...');
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connection SUCCESSFUL!');

        console.log('Testing User Model (Read)...');
        const count = await User.countDocuments();
        console.log(`✅ User Model Works. Found ${count} users.`);

        console.log('All checks passed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection FAILED');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);

        if (err.message.includes('bad auth')) {
            console.log('\n--> TIP: Check your username and password in .env');
        } else if (err.message.includes('buffering timed out') || err.message.includes('ETIMEDOUT')) {
            console.log('\n--> TIP: Check your IP Whitelist in Atlas (Network Access -> Allow All)');
        }
        process.exit(1);
    }
}

testConnection();
