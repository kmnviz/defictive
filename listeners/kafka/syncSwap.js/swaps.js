const initializeMongoDb = require('../../../services/mongoDb');
const initializeKafkaConsumer = require('../../../services/kafkaConsumer');

(async () => {
    const mongoDb = await initializeMongoDb();
    const kafkaConsumer = await initializeKafkaConsumer('swaps');

    await kafkaConsumer.run({
        eachMessage: async ({ message }) => {
            const swapRecord = JSON.parse(message.value.toString());
            console.log(`Swap ${swapRecord.id} received`);

            await mongoDb.collection('swaps').updateOne(
                {
                    id: swapRecord.id,
                }, 
                {
                    $set: swapRecord,
                },
                {
                    upsert: true,
                }
            );
            console.log(`Swap ${swapRecord.id} stored`);
        },
      });
})();
