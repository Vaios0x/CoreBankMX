/// <reference types="hardhat" />
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FeeController', () => {
  it('sets fees within bounds and applies pro discount + min borrow', async () => {
    const [admin, user, collector] = await (ethers as any).getSigners()
    const Fee = await (ethers as any).getContractFactory('FeeController')
    const fee = await Fee.deploy(await admin.getAddress(), await collector.getAddress(), (ethers as any).parseEther('100'))
    await fee.waitForDeployment()
    // As admin has ROLE_ADMIN and is admin of ROLE_RISK, grant ROLE_RISK to self to configure fees
    await (await fee.connect(admin).grantRole(await fee.ROLE_RISK(), await admin.getAddress())).wait()

    // default origination 1.00% -> 100 bps
    let out = await fee.getBorrowFee(await user.getAddress(), (ethers as any).parseEther('1000'))
    expect(out[0]).to.equal((ethers as any).parseEther('10'))
    expect(out[1]).to.equal(await collector.getAddress())

    // set to 0.5%
    await (await fee.connect(admin).setFees(50, 20, 25)).wait()
    out = await fee.getBorrowFee(await user.getAddress(), (ethers as any).parseEther('1000'))
    expect(out[0]).to.equal((ethers as any).parseEther('5'))

    // mark user as pro and check discount (25 bps)
    // admin role already granted in constructor
    await (await fee.connect(admin).setPro(await user.getAddress(), true)).wait()
    out = await fee.getBorrowFee(await user.getAddress(), (ethers as any).parseEther('1000'))
    // effective 50 - 25 = 25 bps => 2.5 on 1000
    expect(out[0]).to.equal((ethers as any).parseEther('2.5'))

    // update min borrow and collector
    await (await fee.connect(admin).setMinBorrow((ethers as any).parseEther('200'))).wait()
    expect(await fee.minBorrowAmount()).to.equal((ethers as any).parseEther('200'))
    await (await fee.connect(admin).setCollector(await user.getAddress())).wait()
    const out2 = await fee.getBorrowFee(await user.getAddress(), (ethers as any).parseEther('1000'))
    expect(out2[1]).to.equal(await user.getAddress())
  })
})


