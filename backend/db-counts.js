const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        for (const c of collections) {
            const count = await db.collection(c.name).countDocuments();
            console.log(`Collection: ${c.name}, Count: ${count}`);
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
