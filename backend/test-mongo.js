const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Rishabh/STUDENT_PORTAL/student_erp/backend/.env' });

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected successfully!');
        const dbName = mongoose.connection.db.databaseName;
        console.log('Database Name:', dbName);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await mongoose.connection.close();
    }
}

test();
