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
    const idx1 = await loan.interestIndex()
    // Advance time by 1 day
    await ethers.provider.send('evm_increaseTime', [24 * 60 * 60])
    await ethers.provider.send('evm_mine', [])
    await (await loan.accrueInterest()).wait()
    const idx2 = await loan.interestIndex()
    expect(idx2).to.be.greaterThan(idx1)
  })
})


