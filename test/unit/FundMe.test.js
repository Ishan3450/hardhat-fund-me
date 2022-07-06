const { deployments, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

// unit test will only run on development chains or local chains
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let FundMeInstance
          let deployer
          let mockV3Aggregator
          let sendValue = ethers.utils.parseEther("1") // 1000000000000000000

          beforeEach(async function () {
              // deploying fundme contract using hardhat-deploy

              // NOTE : below line is too much helpful as it will give all the code of the whole DEPLOY folder
              // => It will do that by getting the tags "all" which is present in 2 file 00 and 01 in deploy folder
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              FundMeInstance = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await FundMeInstance.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  // in the revertedwith one will have to write the same string as written in the contract require method
                  // instead of revertedWith one can also write revert()
                  await expect(FundMeInstance.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })

              it("Updates the spended amount of the ether for the particular funder", async function () {
                  await FundMeInstance.fund({ value: sendValue })
                  // addressToAmountFunded is a mapping the the contract like (address => uint256)
                  const response =
                      await FundMeInstance.getAddressToAmountFunded(deployer)

                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds the funder in the list of the funders", async function () {
                  await FundMeInstance.fund({ value: sendValue })
                  const funder = await FundMeInstance.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              // before withdrawing balance contract must have some initial balance
              // so for initial balance we will use beforeEach
              beforeEach(async function () {
                  // initial bal will be 1 ether
                  await FundMeInstance.fund({ value: sendValue })
              })

              it("Withdraw ETH from a single funder", async function () {
                  const initialFundMeBalance =
                      await FundMeInstance.provider.getBalance(
                          FundMeInstance.address
                      )
                  // we are taking deployer as deployer only will send ethers and only he is the owner of the contract
                  const initialDeployerBalance =
                      await FundMeInstance.provider.getBalance(deployer)

                  const transactionResponse = await FundMeInstance.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  // .mul for BIGNUMBER
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const afterWithdrawingFundMeBalance =
                      await FundMeInstance.provider.getBalance(
                          FundMeInstance.address
                      )
                  const afterWithdrawingDeployerBalance =
                      await FundMeInstance.provider.getBalance(deployer)

                  assert(afterWithdrawingFundMeBalance, 0)
                  assert(
                      // below we are using .add because the return value will be in BIGNUMBER so .add is the method of the bignumber
                      initialDeployerBalance
                          .add(initialFundMeBalance)
                          .toString(),
                      // at the time of transaction gas will be used to to match that value we have to add the gasCost
                      afterWithdrawingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("Withdraw ETH from Multiple funders", async function () {
                  const accounts = await ethers.getSigners()

                  for (let i = 0; i < 6; i++) {
                      const FundMeConnectedContract =
                          await FundMeInstance.connect(accounts[i])
                      await FundMeConnectedContract.fund({ value: sendValue })
                  }

                  const initialFundMeBalance =
                      await FundMeInstance.provider.getBalance(
                          FundMeInstance.address
                      )
                  // we are taking deployer as deployer only will send ethers and only he is the owner of the contract
                  const initialDeployerBalance =
                      await FundMeInstance.provider.getBalance(deployer)

                  const transactionResponse = await FundMeInstance.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const afterWithdrawingFundMeBalance =
                      await FundMeInstance.provider.getBalance(
                          FundMeInstance.address
                      )
                  const afterWithdrawingDeployerBalance =
                      await FundMeInstance.provider.getBalance(deployer)

                  assert(afterWithdrawingFundMeBalance, 0)
                  assert(
                      // below we are using .add because the return value will be in BIGNUMBER so .add is the method of the bignumber
                      initialDeployerBalance
                          .add(initialFundMeBalance)
                          .toString(),
                      // at the time of transaction gas will be used to to match that value we have to add the gasCost
                      afterWithdrawingDeployerBalance.add(gasCost).toString()
                  )

                  // checking if we are getting error on reading the 1st element of the funders array
                  // if we do get array then we have successfully reset the array after withdraw
                  await expect(FundMeInstance.getFunder(0)).to.be.reverted

                  for (let i = 0; i < 6; i++) {
                      assert.equal(
                          await FundMeInstance.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          // to check value
                          0
                      )
                  }
              })

              it("Only allows owner to withdraw funds", async function () {
                  const accounts = await ethers.getSigners()
                  const someRandomAttacker = accounts[1]
                  const attackerConnectedContract =
                      await FundMeInstance.connect(someRandomAttacker)
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner") // FundMe_NotOwner is the error in the contract
              })

              it("Cheaper withdraw function.", async function () {
                  const accounts = await ethers.getSigners()

                  for (let i = 0; i < 6; i++) {
                      const FundMeConnectedContract =
                          await FundMeInstance.connect(accounts[i])
                      await FundMeConnectedContract.fund({ value: sendValue })
                  }

                  const initialFundMeBalance =
                      await FundMeInstance.provider.getBalance(
                          FundMeInstance.address
                      )
                  // we are taking deployer as deployer only will send ethers and only he is the owner of the contract
                  const initialDeployerBalance =
                      await FundMeInstance.provider.getBalance(deployer)

                  const transactionResponse =
                      await FundMeInstance.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const afterWithdrawingFundMeBalance =
                      await FundMeInstance.provider.getBalance(
                          FundMeInstance.address
                      )
                  const afterWithdrawingDeployerBalance =
                      await FundMeInstance.provider.getBalance(deployer)

                  assert(afterWithdrawingFundMeBalance, 0)
                  assert(
                      // below we are using .add because the return value will be in BIGNUMBER so .add is the method of the bignumber
                      initialDeployerBalance
                          .add(initialFundMeBalance)
                          .toString(),
                      // at the time of transaction gas will be used to to match that value we have to add the gasCost
                      afterWithdrawingDeployerBalance.add(gasCost).toString()
                  )

                  // checking if we are getting error on reading the 1st element of the funders array
                  // if we do get array then we have successfully reset the array after withdraw
                  await expect(FundMeInstance.getFunder(0)).to.be.reverted

                  for (let i = 0; i < 6; i++) {
                      assert.equal(
                          await FundMeInstance.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          // to check value
                          0
                      )
                  }
              })
          })
      })
