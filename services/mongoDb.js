require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_NAME;

const initializeMongoDb = async () => {
    try {
        const client = new MongoClient(mongoUrl, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        await client.connect();
        const database = client.db(dbName);

        console.log(`Connected to MongoDB: ${dbName}`);
        return database;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        throw error;
    }
}

module.exports = initializeMongoDb;
  