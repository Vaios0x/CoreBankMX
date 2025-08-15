import fs from 'fs';
import path from 'path';

// Función para leer el ABI de un artefacto
function extractAbiFromArtifact(artifactPath) {
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
  } catch (error) {
    console.error(`Error reading artifact ${artifactPath}:`, error.message);
    return null;
  }
}

// Función para escribir el ABI a un archivo JSON
function writeAbiToFile(abi, outputPath) {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    console.log(`✅ Generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error writing ABI to ${outputPath}:`, error.message);
  }
}

// Configuración de contratos a procesar
const contracts = [
  {
    artifactPath: 'packages/contracts/artifacts/contracts/core/CollateralVault.sol/CollateralVault.json',
    outputPath: 'src/abi/CollateralVault.json',
    name: 'CollateralVault'
  },
  {
    artifactPath: 'packages/contracts/artifacts/contracts/core/LoanManager.sol/LoanManager.json',
    outputPath: 'src/abi/LoanManager.json',
    name: 'LoanManager'
  },
  {
    artifactPath: 'packages/contracts/artifacts/contracts/staking/DualStakingVault.sol/DualStakingVault.json',
    outputPath: 'src/abi/StakingVault.json',
    name: 'DualStakingVault'
  },
  {
    artifactPath: 'packages/contracts/artifacts/contracts/oracle/OracleRouter.sol/OracleRouter.json',
    outputPath: 'src/abi/OracleRouter.json',
    name: 'OracleRouter'
  },
  {
    artifactPath: 'packages/contracts/artifacts/contracts/mocks/MockERC20.sol/MockERC20.json',
    outputPath: 'src/abi/MockERC20.json',
    name: 'MockERC20'
  }
];

// Procesar cada contrato
console.log('🚀 Generating ABIs from Hardhat artifacts...\n');

contracts.forEach(contract => {
  const abi = extractAbiFromArtifact(contract.artifactPath);
  if (abi) {
    writeAbiToFile(abi, contract.outputPath);
  } else {
    console.error(`❌ Failed to extract ABI for ${contract.name}`);
  }
});

console.log('\n✨ ABI generation complete!');
console.log('\n📝 Next steps:');
console.log('1. Verify the generated ABIs in src/abi/');
console.log('2. Update your hooks to use the correct function signatures');
console.log('3. Test the contract interactions');
