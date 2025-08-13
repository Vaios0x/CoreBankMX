import { ethers } from 'hardhat'
import * as fs from 'node:fs'
import * as path from 'node:path'

async function main() {
  const network = await ethers.provider.getNetwork()
  const isTestnet = Number(network.chainId) === 1114
  const file = path.join(__dirname, '../addresses.testnet2.json')
  if (!fs.existsSync(file)) {
    console.error('addresses file not found:', file)
    process.exit(1)
  }
  const addrs = JSON.parse(fs.readFileSync(file, 'utf8'))
  console.log('Verify addresses (core', isTestnet ? 'testnet2' : 'mainnet', '):')
  for (const [name, addr] of Object.entries(addrs)) {
    if (typeof addr !== 'string' || !addr.startsWith('0x')) continue
    console.log(`# ${name}`)
    console.log(`npx hardhat verify --network ${isTestnet ? 'coreTestnet2' : 'coreMainnet'} ${addr}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })


