const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Loads .env from the current directory (backend)

async function check() {
    try {
        const mongoUrl = process.env.DATABASE_URL;
        console.log('Connecting to DATABASE_URL...');
        await mongoose.connect(mongoUrl);
        console.log('Connected!');

        const db = mongoose.connection.db;
        const padronCollection = db.collection('padron');
        
        const count = await padronCollection.countDocuments();
        console.log('Total documents in "padron" collection:', count);
        
        if (count > 0) {
            const sample = await padronCollection.findOne();
            console.log('Sample document found:', JSON.stringify(sample, null, 2));
        } else {
            console.log('WARNING: The "padron" collection is EMPTY.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error during check:', error);
        process.exit(1);
    }
}

check();
