const ethers = require('ethers');
const Decimal = require('decimal.js');
const initializeMongoDb = require('../services/mongoDb');
const networks = require('../networks.json');
const addresses = require('../contracts/syncSwap/addresses.json');
const poolMasterAbi = require('../contracts/syncSwap/poolMasterAbi.json');
const poolAbi = require('../contracts/syncSwap/poolAbi.json');
const iBasePoolAbi = require('../contracts/iBasePoolAbi.json');

(async () => {
    const mongoDb = await initializeMongoDb();
    const provider = new ethers.JsonRpcProvider(networks.zkSyncEra.rpc[0]);

    // Initiate pool master contract
    const poolMasterContract = new ethers.Contract(addresses.poolMaster, poolMasterAbi, provider);
    // Fetch number of pools
    const numberOfPools = (await poolMasterContract.poolsLength()).toString();
    // fetch first created pool
    const poolAddress = await poolMasterContract.pools(0);

    console.log('poolAddress: ', poolAddress);
})();