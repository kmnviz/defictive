module.exports = {
  async up(db) {
    const collection = await db.createCollection('swaps');
    collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 });
  },

  async down(db) {
    await db.collection('swaps').drop();
  },
};