const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config();

const FILE_PATH = 'C:/Users/LPT_EliaSa/Documents/UTN/TicoAutos_Final/padron-master/data/padron.json/padron.json';
const ATLAS_URL = process.env.DATABASE_URL.replace('TicoAutos_FinalVers', 'padron_electoral');
const BATCH_SIZE = 1000; // Smaller batches for Atlas to avoid connection drops

async function run() {
    try {
        console.log('Connecting to MongoDB ATLAS...');
        const conn = await mongoose.createConnection(ATLAS_URL).asPromise();
        console.log('Connected!');

        const db = conn.db;
        const collection = db.collection('padron');

        const fileStream = fs.createReadStream(FILE_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let batch = [];
        let total = 0;

        console.log('Restoring 1.8M records to Atlas (Optimized)...');

        for await (const line of rl) {
            if (!line.trim()) continue;
            try {
                const doc = JSON.parse(line);
                // LEAN OPTIMIZATION: Keep ONLY what we need for the app
                const leanDoc = {
                    CEDULA: doc.CEDULA,
                    NOMBRE: doc.NOMBRE,
                    PAPELLIDO: doc.PAPELLIDO,
                    SAPELLIDO: doc.SAPELLIDO
                };
                
                batch.push(leanDoc);

                if (batch.length >= BATCH_SIZE) {
                    await collection.insertMany(batch);
                    total += batch.length;
                    batch = [];
                    process.stdout.write(`\rRestored: ${total} records...`);
                    
                    // STOP at 1.8M to avoid hitting the 512MB limit again
                    if (total >= 1800000) break;
                }
            } catch (e) {}
        }

        if (batch.length > 0 && total < 1800000) {
            await collection.insertMany(batch);
            total += batch.length;
        }

        console.log(`\nDONE! Total Atlas: ${total}`);
        console.log('Creating index for fast lookups...');
        await collection.createIndex({ CEDULA: 1 });
        console.log('Index ready. API is now LIVE in the cloud again.');
        
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error during Atlas restoration:', err);
        process.exit(1);
    }
}

run();
