import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('OracleRouter', () => {
  it('uses primary if fresh; fallback if primary stale and within deviation', async () => {
    const [admin] = await ethers.getSigners()
    const Red = await ethers.getContractFactory('RedStoneAdapter')
    const Pyth = await ethers.getContractFactory('PythAdapter')
    const red = await Red.deploy(await admin.getAddress())
    const pyth = await Pyth.deploy(await admin.getAddress())
    await red.waitForDeployment(); await pyth.waitForDeployment()
    const Router = await ethers.getContractFactory('OracleRouter')
    const router = await Router.deploy(await admin.getAddress(), await red.getAddress(), await pyth.getAddress())
    await router.waitForDeployment()

    const token = '0x0000000000000000000000000000000000000001'
    const now = (await ethers.provider.getBlock('latest'))!.timestamp
    await (await red.connect(admin).grantRole(await red.ROLE_ORACLE(), await admin.getAddress())).wait()
    await (await pyth.connect(admin).grantRole(await pyth.ROLE_ORACLE(), await admin.getAddress())).wait()
    await (await red.pushPrice(token, 1000n, BigInt(now))).wait()
    await (await pyth.pushPrice(token, 990n, BigInt(now))).wait()

    // primary fresh
    const p1 = await router.getPrice(token)
    expect(p1[0]).to.equal(1000n)

    // make primary stale by setting an old timestamp on primary and fresh on fallback
    const old = now - 1000
    await (await red.pushPrice(token, 1000n, BigInt(old))).wait()
    await (await pyth.pushPrice(token, 990n, BigInt(now))).wait()
    // keep default staleness (120s) and deviation (1.5%) so fallback is accepted
    const p2 = await router.getPrice(token)
    expect(p2[0]).to.equal(990n)
  })

  it('falls back if primary deviates beyond threshold after drop', async () => {
    const [admin] = await ethers.getSigners()
    const Red = await ethers.getContractFactory('RedStoneAdapter')
    const Pyth = await ethers.getContractFactory('PythAdapter')
    const red = await Red.deploy(await admin.getAddress())
    const pyth = await Pyth.deploy(await admin.getAddress())
    await red.waitForDeployment(); await pyth.waitForDeployment()
    const Router = await ethers.getContractFactory('OracleRouter')
    const router = await Router.deploy(await admin.getAddress(), await red.getAddress(), await pyth.getAddress())
    await router.waitForDeployment()
    const token = '0x0000000000000000000000000000000000000001'
    const now = (await ethers.provider.getBlock('latest'))!.timestamp
    await (await red.connect(admin).grantRole(await red.ROLE_ORACLE(), await admin.getAddress())).wait()
    await (await pyth.connect(admin).grantRole(await pyth.ROLE_ORACLE(), await admin.getAddress())).wait()
    // Primary collapses price; fallback sane → router should ignore primary if deviation > threshold
    await (await red.pushPrice(token, 500n, BigInt(now))).wait()
    await (await pyth.pushPrice(token, 1000n, BigInt(now))).wait()
    const p = await router.getPrice(token)
    expect(p[0]).to.equal(1000n)
  })
})


