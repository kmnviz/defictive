require('dotenv').config();
const WebSocket = require('ws');
const initializeMongoDb = require('../../../services/mongoDb');
const initializeKafkaConsumer = require('../../../services/kafkaConsumer');

(async () => {
    const mongoDb = await initializeMongoDb();
    const kafkaConsumer = await initializeKafkaConsumer('swaps');
    const ws = new WebSocket(`ws://localhost:${process.env.HTTP_PORT}`);

    await kafkaConsumer.run({
        eachMessage: async ({ message }) => {
            const messageString = message.value.toString();
            const swapRecord = JSON.parse(messageString);
            console.log(`Swap ${swapRecord.id} received`);

            swapRecord.createdAt = new Date();
            const result = await mongoDb.collection('swaps').updateOne(
                {
                    _id: swapRecord.id,
                }, 
                {
                    $set: swapRecord,
                },
                {
                    upsert: true,
                }
            );


            if (result.upsertedId) {
                ws.send(messageString);
                console.log(`Swap ${swapRecord.id} stored`);
            }
        },
      });
})();
