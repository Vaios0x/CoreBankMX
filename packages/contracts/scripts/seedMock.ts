import { ethers } from 'hardhat'

async function main() {
  const [deployer, user] = await ethers.getSigners()
  const weth = process.env.LSTBTC_ADDRESS
  const usdt = process.env.USDT_ADDRESS
  if (!weth || !usdt) {
    console.log('No LSTBTC_ADDRESS/USDT_ADDRESS provided, deploying mocks...')
    const Mock = await ethers.getContractFactory('MockERC20')
    const btc = await Mock.deploy('Mock BTC', 'mBTC', 18)
    await btc.waitForDeployment()
    const usd = await Mock.deploy('Mock USDT', 'mUSDT', 18)
    await usd.waitForDeployment()
    const baddr = await btc.getAddress()
    const uaddr = await usd.getAddress()
    await (await btc.mint(await user.getAddress(), ethers.parseEther('2'))).wait()
    await (await usd.mint(await deployer.getAddress(), ethers.parseEther('1000000'))).wait()
    console.log('Seeded:', { LSTBTC: baddr, USDT: uaddr })
  } else {
    const erc20 = await ethers.getContractFactory('MockERC20')
    const btc = erc20.attach(weth)
    const usd = erc20.attach(usdt)
    await (await btc.mint(await user.getAddress(), ethers.parseEther('1'))).wait()
    await (await usd.mint(await deployer.getAddress(), ethers.parseEther('500000'))).wait()
    console.log('Seeded existing mocks')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })


