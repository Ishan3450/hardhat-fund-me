const { network, getNamedAccounts, deployments } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    // above line is like hre.getNamedAccounts() and hre.deployments

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethToUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethToUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethToUsdPriceFeedAddress = networkConfig[chainId]["ethToUsdPriceFeed"]
    }

    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")

    const args = [ethToUsdPriceFeedAddress]

    const FundMeInstance = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmation || 1,
    })

    log(`FundMe deployed at ${FundMeInstance.address}`)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // error is coming on the below line
        await verify(FundMeInstance.address, args)
    }

    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
