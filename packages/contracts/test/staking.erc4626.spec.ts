import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('DualStakingVault', () => {
  it('stake/unstake and compound increases index', async () => {
    const [admin, user] = await ethers.getSigners()
    const Mock = await ethers.getContractFactory('MockERC20')
    const token = await Mock.deploy('Mock', 'M', 18)
    await token.waitForDeployment()
    const Vault = await ethers.getContractFactory('DualStakingVault')
    const vault = await Vault.deploy(await admin.getAddress(), await token.getAddress())
    await vault.waitForDeployment()
    await (await token.mint(await user.getAddress(), ethers.parseEther('10'))).wait()
    await (await token.connect(user).approve(await vault.getAddress(), ethers.MaxUint256)).wait()
    await (await vault.connect(user).deposit(ethers.parseEther('5'))).wait()
    const idx1 = await vault.rewardsIndex()
    await (await vault.connect(admin).grantRole(await vault.ROLE_KEEPER(), await admin.getAddress())).wait()
    await (await vault.connect(admin).compound()).wait()
    const idx2 = await vault.rewardsIndex()
    expect(idx2).to.be.greaterThan(idx1)
    await (await vault.connect(user).withdraw(ethers.parseEther('1'))).wait()
  })
})


