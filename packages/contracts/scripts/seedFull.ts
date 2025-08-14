import { ethers } from 'hardhat'
import * as fs from 'node:fs'
import * as path from 'node:path'

async function main() {
  const allSigners = await (ethers as any).getSigners()
  if (!allSigners || allSigners.length === 0) throw new Error('No signers available on this network')
  const deployer = allSigners[0]
  let userSigners = allSigners.slice(1, 4)
  if (userSigners.length === 0) userSigners = [deployer]
  const admin = process.env.SAFE_ADMIN_ADDRESS || deployer.address
  const users = userSigners
  console.log('Seeder admin:', admin)

  // 1) Deploy or reuse everything (calls existing deploy.ts logic inline)
  const CollateralVault = await (ethers as any).getContractFactory('CollateralVault')
  const LoanManager = await (ethers as any).getContractFactory('LoanManager')
  const FeeController = await (ethers as any).getContractFactory('FeeController')
  const LiquidationModule = await (ethers as any).getContractFactory('LiquidationModule')
  const DualStakingVault = await (ethers as any).getContractFactory('DualStakingVault')
  const OracleRouter = await (ethers as any).getContractFactory('OracleRouter')
  const Red = await (ethers as any).getContractFactory('RedStoneAdapter')
  const Pyth = await (ethers as any).getContractFactory('PythAdapter')
  const Mock = await (ethers as any).getContractFactory('MockERC20')

  let lstbtcToken = process.env.LSTBTC_ADDRESS as string | undefined
  let usdtToken = process.env.USDT_ADDRESS as string | undefined
  if (!lstbtcToken) {
    const mockBtc = await Mock.deploy('Mock BTC','mBTC',18)
    await mockBtc.waitForDeployment()
    lstbtcToken = await mockBtc.getAddress()
  }
  if (!usdtToken) {
    const mockUsdt = await Mock.deploy('Mock USDT','mUSDT',18)
    await mockUsdt.waitForDeployment()
    usdtToken = await mockUsdt.getAddress()
  }

  const red = await Red.deploy(admin); await red.waitForDeployment()
  const pyth = await Pyth.deploy(admin); await pyth.waitForDeployment()
  const router = await OracleRouter.deploy(admin, await red.getAddress(), await pyth.getAddress()); await router.waitForDeployment()
  const vault = await CollateralVault.deploy(admin, lstbtcToken); await vault.waitForDeployment()
  const loan = await LoanManager.deploy(admin, usdtToken, await vault.getAddress()); await loan.waitForDeployment()
  const liq = await LiquidationModule.deploy(admin, await loan.getAddress()); await liq.waitForDeployment()
  const stake = await DualStakingVault.deploy(admin, lstbtcToken); await stake.waitForDeployment()
  const fee = await FeeController.deploy(admin, admin, (ethers as any).parseEther('50')); await fee.waitForDeployment()
  await (await loan.setFeeController(await fee.getAddress(), admin)).wait()
  // grant risk role to set oracle
  await (await loan.grantRole(await loan.ROLE_RISK(), admin)).wait()
  await (await loan.setOracle(await router.getAddress(), lstbtcToken)).wait()
  await (await vault.grantRole(await vault.ROLE_RISK(), admin)).wait()
  await (await vault.setLoanManager(await loan.getAddress())).wait()

  // 2) Configure risk/fees defaults (0.5–1.5%)
  await (await loan.grantRole(await loan.ROLE_RISK(), admin)).wait()
  await (await loan.setParams(6000, 7500, 500)).wait()
  await (await fee.grantRole(await fee.ROLE_RISK(), admin)).wait()
  await (await fee.setFees(100, 20, 50)).wait() // 1.0% origination, 0.2% exchange, 0.5% discount
  await (await fee.setMinBorrow((ethers as any).parseEther('50'))).wait()

  // 3) Seed users balances and approve/positions
  const lst = Mock.attach(lstbtcToken)
  const usd = Mock.attach(usdtToken)
  // Fund users with collateral and debt asset
  for (const user of users) {
    await (await (lst as any).mint(await user.getAddress(), (ethers as any).parseEther('2'))).wait()
    await (await (usd as any).mint(await user.getAddress(), (ethers as any).parseEther('10000'))).wait()
    await (await (usd as any).mint(admin, (ethers as any).parseEther('100000'))).wait()
  }
  // Fund LoanManager with USDT to lend
  await (await (usd as any).mint(await deployer.getAddress(), (ethers as any).parseEther('500000'))).wait()
  await (await (usd as any).transfer(await loan.getAddress(), (ethers as any).parseEther('400000'))).wait()

  // 4) Push oracle price (demo): 65k y fallback 64.5k
  await (await red.grantRole(await red.ROLE_ORACLE(), admin)).wait()
  await (await pyth.grantRole(await pyth.ROLE_ORACLE(), admin)).wait()
  const now = (await (ethers as any).provider.getBlock('latest')).timestamp
  await (await red.pushPrice(lstbtcToken, (ethers as any).parseEther('65000'), BigInt(now))).wait()
  await (await pyth.pushPrice(lstbtcToken, (ethers as any).parseEther('64500'), BigInt(now))).wait()

  // 5) Create positions for MONITOR_USERS (use provided signers)
  for (const user of users) {
    await (await (lst as any).connect(user).approve(await vault.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (vault as any).connect(user).deposit((ethers as any).parseEther('1'))).wait()
    await (await (usd as any).connect(user).approve(await loan.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (loan as any).connect(user).borrow((ethers as any).parseEther('300'))).wait()
  }

  // 6) Save addresses file for API/Keeper/UI
  const out = {
    LSTBTC: lstbtcToken,
    USDT: usdtToken,
    RedStoneAdapter: await red.getAddress(),
    PythAdapter: await pyth.getAddress(),
    OracleRouter: await router.getAddress(),
    CollateralVault: await vault.getAddress(),
    LoanManager: await loan.getAddress(),
    LiquidationModule: await liq.getAddress(),
    DualStakingVault: await stake.getAddress(),
    FeeController: await fee.getAddress(),
    admin,
    MONITOR_USERS: await Promise.all(users.map(async (s: any) => await s.getAddress())),
  }
  console.log('Seeded (full):', out)
  const file = path.join(__dirname, '../addresses.testnet2.json')
  fs.writeFileSync(file, JSON.stringify(out, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })


