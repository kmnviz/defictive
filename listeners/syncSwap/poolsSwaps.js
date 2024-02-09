const ethers = require('ethers');
const networks = require('../../networks.json');
const addresses = require('../../contracts/syncSwap/addresses.json');
const poolMasterAbi = require('../../contracts/syncSwap/poolMasterAbi.json');
const iBasePoolAbi = require('../../contracts/iBasePoolAbi.json');

(async () => {
    const providers = [];
    networks.zkSyncEra.wss.forEach((url) => {
        providers.push({ url: url, updated_at: null, connection: 0 });
    });

    const instantiateProvider = (url) => {
        return url.startsWith('http') ? new ethers.JsonRpcProvider(url) : new ethers.WebSocketProvider(url);
    }

    const connectAndListen = async (url, index) => {
        const provider = instantiateProvider(url);
        const poolMasterContract = new ethers.Contract(addresses.poolMaster, poolMasterAbi, provider);
        const poolAddress = await poolMasterContract.pools(0);
        const poolContract = new ethers.Contract(poolAddress, iBasePoolAbi, provider);
        const swapEventFilter = poolContract.filters.Swap(null, null, null, null, null, null);

        providers[index].connection++;
        try {
            await poolContract.on(swapEventFilter, (event) => {
                const now = new Date();
                providers[index].updated_at = now.getTime();
            });

            console.log(`connection with ${url} is established.`);
        } catch (error) {
            console.log(`provider ${providers[index].url} failed. error: `, error);
        }
    }

    for (let i = 0; i < providers.length; i++) {
        await connectAndListen(providers[i].url, i);
    }

    const thresholdInMinutes = 5;
    setInterval(async () => {
        if (providers.every((provider) => provider.updated_at)) {
            const latestProvider = providers.reduce((latest, provider) => {
                return (!latest || provider.updated_at > latest.updated_at) ? provider : latest;
            }, null);

            for (const provider of providers) {
                const timeDifference = latestProvider.updated_at - provider.updated_at;
                const timeDifferenceInMinutes = timeDifference / (1000 * 60);

                if (timeDifferenceInMinutes >= thresholdInMinutes) {
                    console.log(`provider ${provider.url} is ${thresholdInMinutes} minutes behind. reconnecting`);
                    const providerIndex = providers.findIndex((p) => p.url === provider.url);
                    await connectAndListen(provider.url, providerIndex);
                }
            }
        }
    }, 10000);

    const prepareSwapRecord = (event) => {
        return {
            application: 'syncSwap',
            poolAddress: event.emitter.target,
            network: 'zkSyncEra',
            transactionHash: event.log.transactionHash,
            transactionIndex: event.log.transactionIndex,
            blockHash: event.log.blockHash,
            blockNumber: event.log.blockNumber,
            logIndex: event.log.index,
            sender: event.args[0],
            amount0In: event.args[1].toString(),
            amount1In: event.args[2].toString(),
            amount0Out: event.args[3].toString(),
            amount1Out: event.args[4].toString(),
            to: event.args[5],
        };
    }
})();
