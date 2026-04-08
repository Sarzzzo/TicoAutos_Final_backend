const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const readline = require('readline');

dotenv.config();

const FILE_PATH = 'C:/Users/LPT_EliaSa/Documents/UTN/TicoAutos_Final/padron-master/data/padron.json/padron.json';
const BATCH_SIZE = 1000;

async function run() {
    try {
        console.log('Connecting to main database to cleanup...');
        const mainConn = await mongoose.createConnection(process.env.DATABASE_URL).asPromise();
        console.log('Connected to main DB.');

        const mainDb = mainConn.db;
        const mainCollection = mainDb.collection('padron');
        
        console.log('Dropping old padron collection in main DB to free up space...');
        try {
            await mainCollection.drop();
            console.log('Dropped old padron collection.');
        } catch (e) {
            console.log('Old collection not found or already dropped.');
        }
        await mainConn.close();

        console.log('Connecting to NEW padron_electoral database...');
        const padronDbUrl = process.env.DATABASE_URL.includes('TicoAutos_FinalVers') 
            ? process.env.DATABASE_URL.replace('TicoAutos_FinalVers', 'padron_electoral')
            : process.env.DATABASE_URL;

        const padronConn = await mongoose.createConnection(padronDbUrl).asPromise();
        console.log('Connected to padron_electoral DB.');

        const padronDb = padronConn.db;
        const padronCollection = padronDb.collection('padron');

        const fileStream = fs.createReadStream(FILE_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let batch = [];
        let totalProcessed = 0;
        let startTime = Date.now();

        console.log('Starting migration/import...');

        for await (const line of rl) {
            if (!line.trim()) continue;
            try {
                const doc = JSON.parse(line);
                if (doc._id && doc._id.$oid) {
                    delete doc._id;
                }
                batch.push(doc);

                if (batch.length >= BATCH_SIZE) {
                    await padronCollection.insertMany(batch);
                    totalProcessed += batch.length;
                    batch = [];
                    process.stdout.write(`\rProcessed: ${totalProcessed} docs...`);
                    
                    // Break if we reach the storage limit again
                    if (totalProcessed >= 1800000) {
                        console.log('\nReached ~1.8M docs (near 512MB limit). Stopping migration.');
                        break;
                    }
                }
            } catch (err) {
                // Silently skip parse errors
            }
        }

        if (batch.length > 0 && totalProcessed < 1800000) {
            await padronCollection.insertMany(batch);
            totalProcessed += batch.length;
        }

        console.log(`\nMigration complete! Total docs in padron_electoral: ${totalProcessed}`);
        
        console.log('Creating index on CEDULA...');
        await padronCollection.createIndex({ CEDULA: 1 });
        console.log('Index created!');

        await padronConn.close();
        process.exit(0);
    } catch (error) {
        console.error('\nFatal error during migration:', error);
        process.exit(1);
    }
}

run();
