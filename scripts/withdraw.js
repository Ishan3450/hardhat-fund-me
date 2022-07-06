/* 
===========================================
NOTE : To run this script first run "yarn hardhat node" in a second terminal 
    and then run the script with --network localhost.
===========================================
*/

const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const {deployer} = await getNamedAccounts()
    const FundMeInstance = await ethers.getContract("FundMe", deployer)
    await FundMeInstance.fund(
        { value : ethers.utils.parseEther("1")}
    )
    console.log("Funding contract...")
    const beforeBalance = await FundMeInstance.provider.getBalance(FundMeInstance.address)
    console.log(`Before withdraw balance : ${beforeBalance}`)
    console.log("Withdrawing balance....")
    const transactionResponse = await FundMeInstance.withdraw()
    await transactionResponse.wait(1)
    const afterBalance = await FundMeInstance.provider.getBalance(FundMeInstance.address)
    console.log(`After withdraw balance : ${afterBalance}`)
    console.log("Successfully withdrawed the funds......")
}

main().then(
    () => process.exit(0)
).catch(
    (error) => {
        console.log(error)
        process.exit(1)
    }
)