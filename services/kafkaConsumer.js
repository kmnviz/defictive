require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER] });
const kafkaConsumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID });

const initializeKafkaConsumer = async (topic) => {
    await kafkaConsumer.connect();
    await kafkaConsumer.subscribe({ topic, fromBeginning: true });

    return kafkaConsumer;
}

module.exports = initializeKafkaConsumer;
