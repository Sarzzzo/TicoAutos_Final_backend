const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

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
            const sample = await padronCollection.findOne({ CEDULA: 208830610 });
            if (sample) {
                console.log('SUCCESS: Document found for 208830610:', JSON.stringify(sample, null, 2));
            } else {
                console.log('No document found for 208830610, but total count is:', count);
                const first = await padronCollection.findOne();
                console.log('First document in collection:', JSON.stringify(first, null, 2));
            }
        } else {
            console.log('WARNING: The "padron" collection is still EMPTY.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

check();
