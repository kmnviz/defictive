const ethers = require('ethers');
const Decimal = require('decimal.js');
const initializeMongoDb = require('../../services/mongoDb');
const networks = require('../../networks.json');
const addresses = require('../../contracts/syncSwap/addresses.json');
const poolMasterAbi = require('../../contracts/syncSwap/poolMasterAbi.json');
const iBasePoolAbi = require('../../contracts/iBasePoolAbi.json');
const erc20Abi = require('../../contracts/erc20Abi.json');

(async () => {
    const mongoDb = await initializeMongoDb();
    const provider = new ethers.JsonRpcProvider(networks.zkSyncEra.rpc[0]);

    // Initiate pool master contract
    const poolMasterContract = new ethers.Contract(addresses.poolMaster, poolMasterAbi, provider);
    // Fetch number of pools
    const numberOfPools = Decimal((await poolMasterContract.poolsLength()).toString()).toNumber();

    // Prepare pool record
    // Store pool record in DB
    const prepareAndStorePoolRecord = async (index) => {
        // Fetch pool address
        const poolAddress = await poolMasterContract.pools(index);
        // Initiate pool contract
        const poolContract = new ethers.Contract(poolAddress, iBasePoolAbi, provider);
        // Fetch pool assets
        const poolAssetsAddresses = await poolContract.getAssets();
        // Fetch pool reserves
        const poolReserves = (await poolContract.getReserves()).map((reserve) => reserve.toString());
        // Initiate assets contracts
        const poolAssets = poolAssetsAddresses.map((assetAddress) => {
            return {
                address: assetAddress,
                contract: new ethers.Contract(assetAddress, erc20Abi, provider),
            };
        });
        // Create pool record for database storage
        const poolRecord = {
            application: 'syncSwap',
            address: poolAddress,
            network: 'zkSyncEra',
            name: await poolContract.name(),
            symbol: await poolContract.symbol(),
            decimals: (await poolContract.decimals()).toString(),
            totalSupply: (await poolContract.totalSupply()).toString(),
            type: await poolContract.poolType(),
            index: 0,
            assets: await Promise.all(
                poolAssets.map(async (poolAsset) => {
                    return {
                        address: poolAsset.address,
                        name: await poolAsset.contract.name(),
                        symbol: await poolAsset.contract.symbol(),
                        decimals: await poolAsset.contract.decimals(),
                    };
                })
            ),
        };

        // Store poolRecord into the database
        await mongoDb.collection('pools').insertOne(poolRecord);
        console.log(`Pool name: ${poolRecord.name}`);
        console.log(`Pool reserves: ${poolReserves}`);
        console.log(`Pool number ${index}:${poolAddress} stored.`);
        console.log('----------');
    }

    const maxRetries = 10;
    const nextDelay = 10000;
    const retryDelay = 30000;
    let retriesCount = 0;
    for (let i = 0; i < numberOfPools; i++) {
        let success = false;
        while (!success && retriesCount < maxRetries) {
            try {
                // Prepare record and store into DB
                await prepareAndStorePoolRecord(i);
                // Pause before next pool fetch
                await new Promise((resolve) => {
                    setTimeout(resolve, nextDelay);
                });

                // If the operation was successful, break out of the retry loop
                success = true;
            } catch (error) {
                retriesCount++;
                console.error(`Error fetching pool ${i}. Retry attemp ${retriesCount}. error: `, error);
                // Pause before next retry
                await new Promise((resolve) => {
                    setTimeout(resolve, retryDelay);
                });
            }
        }
    }
})();