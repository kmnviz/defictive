require('dotenv').config();

module.exports = {
    mongodb: {
      url: process.env.MONGODB_URL,
      databaseName: process.env.MONGODB_NAME,
    },
    migrationsDir: 'migrations',
    changelogCollectionName: 'changelog',
    migrationFileExtension: '.js',
    useFileHash: false,
    moduleSystem: 'commonjs',
  };