import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('InterestAccrual', () => {
  it('accrues interest and increases index over time', async () => {
    const [admin, user] = await ethers.getSigners()
    const Mock = await ethers.getContractFactory('MockERC20')
    const usdt = await Mock.deploy('USDT', 'USDT', 18)
    await usdt.waitForDeployment()
    const CollateralVault = await ethers.getContractFactory('CollateralVault')
    const LoanManager = await ethers.getContractFactory('LoanManager')
    const vault = await CollateralVault.deploy(await admin.getAddress(), await usdt.getAddress())
    await vault.waitForDeployment()
    const loan = await LoanManager.deploy(await admin.getAddress(), await usdt.getAddress(), await vault.getAddress())
    await loan.waitForDeployment()
    // Seed vault collateral for user to avoid LTV error
    await (await usdt.mint(await user.getAddress(), ethers.parseEther('100'))).wait()
    // For this test we reuse USDT as mock collateral token; deposit collateral
    const vaultAsDebt = await CollateralVault.attach(await vault.getAddress())
    await (await usdt.connect(user).approve(await vaultAsDebt.getAddress(), ethers.MaxUint256)).wait()
    await (await vaultAsDebt.connect(user).deposit(ethers.parseEther('100'))).wait()
    // Fund LoanManager with USDT to lend out
    await (await usdt.mint(await admin.getAddress(), ethers.parseEther('1000000'))).wait()
    await (await usdt.transfer(await loan.getAddress(), ethers.parseEther('500000'))).wait()
    const idx1 = await loan.interestIndex()
    // Advance time by 1 day
    await ethers.provider.send('evm_increaseTime', [24 * 60 * 60])
    await ethers.provider.send('evm_mine', [])
    await (await loan.accrueInterest()).wait()
    const idx2 = await loan.interestIndex()
    expect(idx2).to.be.greaterThan(idx1)

    // Usuario acumula interés individualmente (userIndex tracking)
    const userAddr = await user.getAddress()
    await (await usdt.mint(userAddr, ethers.parseEther('1000'))).wait()
    await (await usdt.connect(user).approve(await loan.getAddress(), ethers.MaxUint256)).wait()
    await (await loan.connect(user).borrow(ethers.parseEther('10'))).wait()
    const before = await loan.debtOf(userAddr)
    await ethers.provider.send('evm_increaseTime', [12 * 60 * 60])
    await ethers.provider.send('evm_mine', [])
    await (await loan.accrueInterest()).wait()
    const after = await loan.debtOf(userAddr)
    expect(after).to.be.greaterThan(before)
  })
})


