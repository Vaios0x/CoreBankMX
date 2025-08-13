import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Vault/Loan/Liquidations', () => {
  it('blocks borrow above target LTV, prevents unsafe withdraw, and liquidates with seize', async () => {
    const [admin, user] = await ethers.getSigners()
    const BTC = await ethers.getContractFactory('MockERC20')
    const USDT = await ethers.getContractFactory('MockERC20')
    const btc = await BTC.deploy('Mock BTC', 'mBTC', 18)
    const usdt = await USDT.deploy('Mock USDT', 'mUSDT', 18)
    await btc.waitForDeployment(); await usdt.waitForDeployment()

    const CollateralVault = await ethers.getContractFactory('CollateralVault')
    const LoanManager = await ethers.getContractFactory('LoanManager')
    const vault = await CollateralVault.deploy(await admin.getAddress(), await btc.getAddress())
    await vault.waitForDeployment()
    const loan = await LoanManager.deploy(await admin.getAddress(), await usdt.getAddress(), await vault.getAddress())
    await loan.waitForDeployment()
    // link vault -> loan for withdraw checks
    await (await vault.connect(admin).grantRole(await vault.ROLE_RISK(), await admin.getAddress())).wait()
    await (await vault.connect(admin).setLoanManager(await loan.getAddress())).wait()

    // Seed balances
    await (await btc.mint(await user.getAddress(), ethers.parseEther('1'))).wait()
    await (await usdt.mint(await admin.getAddress(), ethers.parseEther('1000000'))).wait()
    // Admin funds LoanManager to lend out
    await (await usdt.transfer(await loan.getAddress(), ethers.parseEther('500000'))).wait()

    // User deposits 1 BTC as collateral
    await (await btc.connect(user).approve(await vault.getAddress(), ethers.MaxUint256)).wait()
    await (await vault.connect(user).deposit(ethers.parseEther('1'))).wait()

    // Try to borrow 0.8 BTC worth (assuming 1:1 for mock) -> targetLtv=0.6, should revert
    await expect(loan.connect(user).borrow(ethers.parseEther('0.8'))).to.be.reverted

    // Borrow 0.5 ok (captures fee event)
    const tx = await loan.connect(user).borrow(ethers.parseEther('0.5'))
    await tx.wait()
    const data = await loan.getAccountData(await user.getAddress())
    expect(data[1]).to.equal(ethers.parseEther('0.5'))

    // Attempt to withdraw that would break HF should revert
    await expect(vault.connect(user).withdraw(ethers.parseEther('0.6'))).to.be.reverted

    // Liquidation module end-to-end
    const Liq = await ethers.getContractFactory('LiquidationModule')
    const liq = await Liq.deploy(await admin.getAddress(), await loan.getAddress())
    await liq.waitForDeployment()
    await (await liq.connect(admin).grantRole(await liq.ROLE_KEEPER(), await admin.getAddress())).wait()
    // allow liquidation module to seize from vault
    await (await vault.connect(admin).grantRole(await vault.ROLE_KEEPER(), await liq.getAddress())).wait()
    // Force liquidation by tightening risk params (target 30%, liq 40%)
    await (await loan.connect(admin).grantRole(await loan.ROLE_RISK(), await admin.getAddress())).wait()
    await (await loan.connect(admin).setParams(3000, 4000, 500)).wait()
    // Approve keeper spend and fund keeper (module pulls from msg.sender)
    await (await usdt.connect(admin).approve(await liq.getAddress(), ethers.parseEther('1'))).wait()
    // Run liquidation for a small amount
    await (await liq.connect(admin).liquidate(await user.getAddress(), ethers.parseEther('0.1'))).wait()
  })
})


