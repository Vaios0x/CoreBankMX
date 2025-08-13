import { ethers } from 'hardhat'
import * as fs from 'node:fs'
import * as path from 'node:path'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  const admin = process.env.SAFE_ADMIN_ADDRESS || deployer.address
  const lstBtcEnv = process.env.LSTBTC_ADDRESS
  const usdtEnv = process.env.USDT_ADDRESS

  const CollateralVault = await ethers.getContractFactory('CollateralVault')
  const LoanManager = await ethers.getContractFactory('LoanManager')
  const FeeController = await ethers.getContractFactory('FeeController')
  const LiquidationModule = await ethers.getContractFactory('LiquidationModule')
  const DualStakingVault = await ethers.getContractFactory('DualStakingVault')
  const OracleRouter = await ethers.getContractFactory('OracleRouter')
  const Red = await ethers.getContractFactory('RedStoneAdapter')
  const Pyth = await ethers.getContractFactory('PythAdapter')

  // Resolve token addresses or deploy mocks
  let lstbtc = lstBtcEnv
  let usdt = usdtEnv
  if (!lstbtc || !usdt) {
    const Mock = await ethers.getContractFactory('MockERC20')
    const mockBtc = await Mock.deploy('Mock BTC', 'mBTC', 18)
    await mockBtc.waitForDeployment()
    const mockUsdt = await Mock.deploy('Mock USDT', 'mUSDT', 18)
    await mockUsdt.waitForDeployment()
    lstbtc = await mockBtc.getAddress()
    usdt = await mockUsdt.getAddress()
  }

  // Deploy adapters and router
  const red = await Red.deploy(admin)
  await red.waitForDeployment()
  const pyth = await Pyth.deploy(admin)
  await pyth.waitForDeployment()
  const router = await OracleRouter.deploy(admin, await red.getAddress(), await pyth.getAddress())
  await router.waitForDeployment()

  // Deploy core contracts
  const vault = await CollateralVault.deploy(admin, lstbtc)
  await vault.waitForDeployment()
  const loan = await LoanManager.deploy(admin, usdt, await vault.getAddress())
  await loan.waitForDeployment()
  const liq = await LiquidationModule.deploy(admin, await loan.getAddress())
  await liq.waitForDeployment()
  const stake = await DualStakingVault.deploy(admin, lstbtc)
  await stake.waitForDeployment()

  // Deploy FeeController and wire it
  const feeCollector = admin
  const minBorrow = ethers.parseEther('50')
  const fee = await FeeController.deploy(admin, feeCollector, minBorrow)
  await fee.waitForDeployment()
  await (await loan.setFeeController(await fee.getAddress(), feeCollector)).wait()

  // Wire oracle in LoanManager (collateral token is lstbtc)
  await (await loan.setOracle(await router.getAddress(), lstbtc)).wait()
  // Backref LoanManager in Vault for withdraw/LTV checks
  await (await vault.grantRole(await vault.ROLE_RISK(), admin)).wait()
  await (await vault.setLoanManager(await loan.getAddress())).wait()

  const out = {
    LSTBTC: lstbtc,
    USDT: usdt,
    RedStoneAdapter: await red.getAddress(),
    PythAdapter: await pyth.getAddress(),
    OracleRouter: await router.getAddress(),
    CollateralVault: await vault.getAddress(),
    LoanManager: await loan.getAddress(),
    LiquidationModule: await liq.getAddress(),
    DualStakingVault: await stake.getAddress(),
    FeeController: await fee.getAddress(),
    admin,
  }
  console.log('Deployed:', out)
  const file = path.join(__dirname, '../addresses.testnet2.json')
  fs.writeFileSync(file, JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


