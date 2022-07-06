const { inputToConfig } = require("@ethereum-waffle/compiler")
const { assert } = require("chai")
const { ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let deployer
          let FundMeInstance
          // ! To Prevent error : BIG NOTE : Only enter the parseEther value less than the amount of ethers in your metamsk wallet
          const sendValue = ethers.utils.parseEther("0.1")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              FundMeInstance = await ethers.getContract("FundMe", deployer)
          })

          it("Allows users to fund and withdraw funds", async function () {
              await FundMeInstance.fund({ value: sendValue })
              await FundMeInstance.withdraw()
              const afterWithdrawingBalance =
                  await FundMeInstance.provider.getBalance(
                      FundMeInstance.address
                  )
              assert(afterWithdrawingBalance, 0)
          })
      })
