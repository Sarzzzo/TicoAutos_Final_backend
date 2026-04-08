const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function check() {
    try {
        const mongoUrl = process.env.DATABASE_URL;
        await mongoose.connect(mongoUrl);
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            process.stdout.write(`COLL: ${coll.name} COUNT: ${count}\n`);
        }
        process.exit(0);
    } catch (error) {
        process.stdout.write(`ERR: ${error.message}\n`);
        process.exit(1);
    }
}

check();
