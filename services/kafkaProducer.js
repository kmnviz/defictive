require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER] });
const kafkaProducer = kafka.producer();

const initializeKafkaProducer = async () => {
    await kafkaProducer.connect();
    
    return kafkaProducer;
}

module.exports = initializeKafkaProducer;
