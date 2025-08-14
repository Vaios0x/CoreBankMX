/// <reference types="hardhat" />
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('LiquidationModule', () => {
  it('reverts on healthy position and liquidates unsafe', async () => {
    const [admin, user, keeper] = await (ethers as any).getSigners()
    const Mock = await (ethers as any).getContractFactory('MockERC20')
    const btc = await Mock.deploy('BTC', 'BTC', 18)
    const usdt = await Mock.deploy('USDT', 'USDT', 18)
    await btc.waitForDeployment(); await usdt.waitForDeployment()
    const Vault = await (ethers as any).getContractFactory('CollateralVault')
    const Loan = await (ethers as any).getContractFactory('LoanManager')
    const vault = await Vault.deploy(await admin.getAddress(), await btc.getAddress())
    await vault.waitForDeployment()
    const loan = await Loan.deploy(await admin.getAddress(), await usdt.getAddress(), await vault.getAddress())
    await loan.waitForDeployment()
    await (await vault.connect(admin).grantRole(await vault.ROLE_RISK(), await admin.getAddress())).wait()
    await (await vault.connect(admin).setLoanManager(await loan.getAddress())).wait()
    const Liq = await (ethers as any).getContractFactory('LiquidationModule')
    const liq = await Liq.deploy(await admin.getAddress(), await loan.getAddress())
    await liq.waitForDeployment()
    await (await liq.connect(admin).grantRole(await liq.ROLE_KEEPER(), await keeper.getAddress())).wait()
    // allow liquidation module to seize from vault
    await (await (vault as any).connect(admin).grantRole(await vault.ROLE_KEEPER(), await liq.getAddress())).wait()

    await (await (btc as any).mint(await user.getAddress(), (ethers as any).parseEther('1'))).wait()
    await (await (usdt as any).mint(await keeper.getAddress(), (ethers as any).parseEther('1000'))).wait()
    await (await (usdt as any).mint(await admin.getAddress(), (ethers as any).parseEther('1000000'))).wait()
    await (await usdt.transfer(await loan.getAddress(), (ethers as any).parseEther('500000'))).wait()
    await (await (btc as any).connect(user).approve(await vault.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (vault as any).connect(user).deposit((ethers as any).parseEther('1'))).wait()

    // Healthy position reverts
    await expect((liq as any).connect(keeper).liquidate(await user.getAddress(), (ethers as any).parseEther('0.1'))).to.be.reverted

    // First, borrow under default params (target 60%, liq 75%) to create sizeable debt
    await (await (usdt as any).connect(user).approve(await loan.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (loan as any).connect(user).borrow((ethers as any).parseEther('0.5'))).wait()
    // Then tighten params to force undercollateralization
    await (await loan.connect(admin).grantRole(await loan.ROLE_RISK(), await admin.getAddress())).wait()
    await (await loan.connect(admin).setParams(3000, 4000, 500)).wait()
    await (await (usdt as any).connect(keeper).approve(await liq.getAddress(), (ethers as any).MaxUint256)).wait()
    await (await (liq as any).connect(keeper).liquidate(await user.getAddress(), (ethers as any).parseEther('0.1'))).wait()
  })
})


