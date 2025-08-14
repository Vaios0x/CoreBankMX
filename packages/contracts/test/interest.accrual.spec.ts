/// <reference types="hardhat" />
import { expect } from 'chai'
import { ethers, network } from 'hardhat'

describe('InterestAccrual', () => {
  it('accrues interest and increases index over time', async () => {
    const [admin, user] = await (ethers as any).getSigners()
    const Mock = await (ethers as any).getContractFactory('MockERC20')
    const usdt = await Mock.deploy('USDT', 'USDT', 18)
    await usdt.waitForDeployment()
    const CollateralVault = await (ethers as any).getContractFactory('CollateralVault')
    const LoanManager = await (ethers as any).getContractFactory('LoanManager')
    const vault = await CollateralVault.deploy(await admin.getAddress(), await usdt.getAddress())
    await vault.waitForDeployment()
    const loan = await LoanManager.deploy(await admin.getAddress(), await usdt.getAddress(), await vault.getAddress())
    await loan.waitForDeployment()
    // Seed vault collateral for user to avoid LTV error
    await (await usdt.mint(await user.getAddress(), ethers.parseEther('100'))).wait()
    // For this test we reuse USDT as mock collateral token; deposit collateral
    const vaultAsDebt = await CollateralVault.attach(await vault.getAddress())
    await (await (usdt as any).connect(user).approve(await vaultAsDebt.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (vaultAsDebt as any).connect(user).deposit((ethers as any).parseEther('100'))).wait()
    // Fund LoanManager with USDT to lend out
    await (await (usdt as any).mint(await admin.getAddress(), (ethers as any).parseEther('1000000'))).wait()
    await (await usdt.transfer(await loan.getAddress(), (ethers as any).parseEther('500000'))).wait()
    const idx1 = await loan.interestIndex()
    // Advance time by 1 day
    await network.provider.send('evm_increaseTime', [24 * 60 * 60])
    await network.provider.send('evm_mine', [])
    await (await loan.accrueInterest()).wait()
    const idx2 = await loan.interestIndex()
    expect(idx2).to.be.greaterThan(idx1)

    // Usuario acumula interés individualmente (userIndex tracking)
    const userAddr = await user.getAddress()
    await (await (usdt as any).mint(userAddr, (ethers as any).parseEther('1000'))).wait()
    await (await (usdt as any).connect(user).approve(await loan.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (loan as any).connect(user).borrow((ethers as any).parseEther('10'))).wait()
    const before = await loan.debtOf(userAddr)
    await network.provider.send('evm_increaseTime', [12 * 60 * 60])
    await network.provider.send('evm_mine', [])
    await (await loan.accrueInterest()).wait()
    const after = await loan.debtOf(userAddr)
    expect(after).to.be.greaterThan(before)
  })
})


