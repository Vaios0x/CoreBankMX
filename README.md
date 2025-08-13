# Core Neobank MX — Frontend (SPA)

SPA en React + Vite + TypeScript para “Core Neobank MX: Remesas y Préstamos con BTC como colateral”.

## Requisitos
- Node 18+

## Scripts
- `npm run dev`: desarrollo
- `npm run build`: build
- `npm run preview`: servidor de preview
- `npm run typecheck`: `tsc --noEmit`

## Configuración .env
Copiar `.env.example` a `.env` y ajustar:
```
VITE_CORE_CHAIN_ID_MAINNET=1116
VITE_CORE_CHAIN_ID_TESTNET=1114
VITE_CORE_RPC_MAINNET=https://rpc.coredao.org
VITE_CORE_RPC_TESTNET=https://rpc.test2.btcs.network
VITE_EXPLORER_MAINNET=https://scan.coredao.org
VITE_EXPLORER_TESTNET=https://scan.test2.btcs.network
VITE_CONTRACT_COLLATERAL_VAULT=0x...
VITE_CONTRACT_LOAN_MANAGER=0x...
VITE_CONTRACT_STAKING_VAULT=0x...
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Notas
- Accesibilidad: focus rings visibles, navegación por teclado.
- Animaciones: Motion-safe, respetando `prefers-reduced-motion`.
- Web3: Chains Core Mainnet/Testnet2, auto-connect, Web3Modal.


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
