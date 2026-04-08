const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function check() {
    try {
        const mongoUrl = process.env.DATABASE_URL;
        await mongoose.connect(mongoUrl);
        console.log('Connected!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        for (const coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            console.log(`Collection "${coll.name}" has ${count} documents.`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

check();
