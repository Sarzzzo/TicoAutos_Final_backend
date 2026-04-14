const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');

const FILE_PATH = 'C:/Users/LPT_EliaSa/Documents/UTN/TicoAutos_Final/padron-master/data/padron.json';
const LOCAL_URL = 'mongodb://localhost:27017/padron_electoral';
const BATCH_SIZE = 5000;

async function run() {
    try {
        console.log('Connecting to LOCAL MongoDB...');
        const conn = await mongoose.createConnection(LOCAL_URL).asPromise();
        console.log('Connected!');

        const db = conn.db;
        const collection = db.collection('padron');

        console.log('Cleaning local collection...');
        await collection.deleteMany({});

        const fileStream = fs.createReadStream(FILE_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let batch = [];
        let total = 0;
        let start = Date.now();

        console.log('Importing ALL records locally (No limits)...');

        for await (const line of rl) {
            if (!line.trim()) continue;
            try {
                const doc = JSON.parse(line);
                if (doc._id && doc._id.$oid) delete doc._id;
                batch.push(doc);

                if (batch.length >= BATCH_SIZE) {
                    await collection.insertMany(batch);
                    total += batch.length;
                    batch = [];
                    process.stdout.write(`\rImported: ${total} records...`);
                }
            } catch (e) {}
        }

        if (batch.length > 0) {
            await collection.insertMany(batch);
            total += batch.length;
        }

        console.log(`\nDONE! Total: ${total}`);
        console.log('Creating index...');
        await collection.createIndex({ CEDULA: 1 });
        console.log('Index ready.');
        
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
}

run();
