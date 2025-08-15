#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());

// Mock data
const mockContracts = {
  collateralVault: '0xeC153A56E676a34360B884530cf86Fb53D916908',
  loanManager: '0x4755014b4b34359c27B8A289046524E0987833F9',
  stakingVault: '0x3973A4471D1CB66274E33dD7f9802b19D7bF6CDc',
  oracleRouter: '0x6B6a0Ad18f8E13299673d960f7dCeAaBfd64d82c'
};

const mockParams = {
  baseRate: 0.05,
  targetLtv: 0.75,
  liquidationLtv: 0.85,
  originationFeeBps: 50,
  minBorrowAmount: 100
};

const mockMetrics = {
  activePositions: 1250,
  liquidations24h: 3,
  tvlUsd: 2500000
};

const mockLiquidations = [
  {
    id: '1',
    user: '0x1234...5678',
    tx: '0xabcd...efgh',
    timestamp: Date.now() - 3600000,
    repayAmount: 1500,
    collateralAmount: 2000
  },
  {
    id: '2',
    user: '0x8765...4321',
    tx: '0xdcba...hgfe',
    timestamp: Date.now() - 7200000,
    repayAmount: 800,
    collateralAmount: 1200
  }
];

const mockPriceHistory = {
  BTC: {
    points: Array.from({ length: 24 }, (_, i) => ({
      v: 60000 + Math.sin(i / 3) * 1000
    }))
  },
  ETH: {
    points: Array.from({ length: 24 }, (_, i) => ({
      v: 3000 + Math.sin(i / 3) * 200
    }))
  }
};

// Routes
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    contracts: mockContracts,
    timestamp: Date.now()
  });
});

app.get('/market/params', (req, res) => {
  res.json(mockParams);
});

app.get('/market/metrics', (req, res) => {
  res.json(mockMetrics);
});

app.get('/market/liquidations', (req, res) => {
  res.json({
    items: mockLiquidations,
    total: mockLiquidations.length
  });
});

app.get('/market/history/:symbol', (req, res) => {
  const { symbol } = req.params;
  const history = mockPriceHistory[symbol] || mockPriceHistory.BTC;
  res.json(history);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET /status`);
  console.log(`   GET /market/params`);
  console.log(`   GET /market/metrics`);
  console.log(`   GET /market/liquidations`);
  console.log(`   GET /market/history/:symbol`);
  console.log(`   GET /health`);
  console.log(`\n🔗 Frontend should connect to: http://localhost:${PORT}`);
});
