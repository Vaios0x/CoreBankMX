# 📋 Guía de Uso de ABIs

## 🎯 Descripción

Los ABIs (Application Binary Interfaces) son archivos JSON que definen la interfaz de los contratos inteligentes. En este proyecto, los ABIs se generan automáticamente desde los artefactos de Hardhat.

## 📁 Estructura de Archivos

```
src/abi/
├── CollateralVault.json    # Vault para colateral BTC
├── LoanManager.json        # Gestión de préstamos
├── StakingVault.json       # Vault de staking ERC4626
├── OracleRouter.json       # Router de oráculos
├── MockERC20.json          # Token ERC20 mock
└── types.ts               # Tipos TypeScript
```

## 🚀 Generación Automática

Los ABIs se generan automáticamente usando el script `scripts/generate-abis.js`:

```bash
# Generar ABIs manualmente
pnpm run generate:abis

# Los ABIs se generan automáticamente después de pnpm install
pnpm install
```

## 📝 Uso en Hooks

### 1. Importar el ABI

```typescript
import CollateralVaultAbi from '../abi/CollateralVault.json'
import LoanManagerAbi from '../abi/LoanManager.json'
import StakingVaultAbi from '../abi/StakingVault.json'
```

### 2. Usar en Transacciones

```typescript
// Ejemplo: Depositar colateral
const deposit = async (amount: number) => {
  const value = parseEther(amount.toString())
  return await writeContractAsync({
    address: CONTRACTS.CollateralVault as `0x${string}`,
    abi: CollateralVaultAbi as any,
    functionName: 'deposit',
    args: [value]
  })
}
```

### 3. Leer Datos del Contrato

```typescript
// Ejemplo: Obtener balance de colateral
const getCollateralBalance = async (user: string) => {
  return await publicClient.readContract({
    address: CONTRACTS.CollateralVault as `0x${string}`,
    abi: CollateralVaultAbi as any,
    functionName: 'balanceOf',
    args: [user]
  })
}
```

## 🔧 Funciones Principales por Contrato

### CollateralVault
- `deposit(amount)` - Depositar colateral
- `withdraw(amount)` - Retirar colateral
- `balanceOf(user)` - Obtener balance de usuario
- `asset()` - Obtener dirección del token de colateral

### LoanManager
- `borrow(amount)` - Solicitar préstamo
- `repay(amount)` - Repagar deuda
- `getAccountData(user)` - Obtener datos de cuenta
- `targetLtv()` - Obtener LTV objetivo
- `liquidationLtv()` - Obtener LTV de liquidación

### StakingVault (ERC4626)
- `deposit(assets)` - Depositar para staking
- `withdraw(assets)` - Retirar del staking
- `balanceOf(user)` - Obtener balance de staking
- `totalAssets()` - Obtener total de assets

### OracleRouter
- `getPrice(token)` - Obtener precio de token
- `primary()` - Obtener oráculo primario
- `fallback()` - Obtener oráculo de respaldo

### MockERC20
- `approve(spender, amount)` - Aprobar gasto
- `transfer(to, amount)` - Transferir tokens
- `balanceOf(account)` - Obtener balance
- `allowance(owner, spender)` - Obtener allowance

## 🎨 Tipos TypeScript

Los tipos están definidos en `src/abi/types.ts`:

```typescript
import type { CollateralVaultABI, LoanManagerABI } from '../abi/types'

// Usar tipos para mejor autocompletado
const vaultContract: CollateralVaultABI = {
  deposit: async (amount: bigint) => { /* ... */ },
  withdraw: async (amount: bigint) => { /* ... */ }
}
```

## 🔄 Actualización de ABIs

Cuando se modifiquen los contratos:

1. **Compilar contratos**:
   ```bash
   cd packages/contracts
   pnpm run build
   ```

2. **Regenerar ABIs**:
   ```bash
   pnpm run generate:abis
   ```

3. **Verificar cambios**:
   ```bash
   git diff src/abi/
   ```

## ⚠️ Consideraciones Importantes

### 1. Tipado
- Usar `as any` temporalmente para evitar errores de TypeScript
- Los tipos completos están en `types.ts`

### 2. Manejo de Errores
- Siempre envolver las transacciones en try-catch
- Verificar que el contrato existe antes de llamarlo

### 3. Gas Estimation
- Usar `estimateGas` antes de enviar transacciones
- Considerar límites de gas para diferentes redes

### 4. Eventos
- Los eventos están incluidos en los ABIs
- Usar `getLogs` para escuchar eventos

## 🧪 Testing

Para probar las interacciones con contratos:

```typescript
// Ejemplo de test
describe('CollateralVault', () => {
  it('should deposit collateral', async () => {
    const amount = parseEther('1')
    const tx = await deposit(amount)
    expect(tx).toBeDefined()
  })
})
```

## 📚 Recursos Adicionales

- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ERC4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
