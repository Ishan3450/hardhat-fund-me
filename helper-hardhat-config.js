const networkConfig = {
    4: {
        name: "rinkeby",
        ethToUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    31337: {
        name: "localhost",
    },
}

const developmentChains = ["hardhat", "localhost"]
    
module.exports = {
    networkConfig,
    developmentChains,
}
