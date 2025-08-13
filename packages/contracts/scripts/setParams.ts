import { ethers } from 'hardhat'

async function main() {
  const [signer] = await ethers.getSigners()
  const admin = process.env.SAFE_ADMIN_ADDRESS || signer.address
  const loanAddress = process.env.LOAN_MANAGER_ADDRESS
  if (!loanAddress) throw new Error('LOAN_MANAGER_ADDRESS required')
  const loan = await ethers.getContractAt('LoanManager', loanAddress)
  const target = Number(process.env.TARGET_LTV_BPS || 6000)
  const liq = Number(process.env.LIQ_LTV_BPS || 7500)
  const baseRate = Number(process.env.BASE_RATE_BPS || 500)
  console.log('Setting params as', admin, { target, liq, baseRate })
  const role = await loan.ROLE_RISK()
  const has = await loan.hasRole(role, admin)
  if (!has) {
    const tx = await loan.grantRole(role, admin)
    await tx.wait()
  }
  const tx2 = await loan.setParams(target, liq, baseRate)
  await tx2.wait()
  console.log('Params updated')
}

main().catch((e) => { console.error(e); process.exit(1) })


