import { test, expect } from '@playwright/test'

test('Borrow/Repay flows render and show actions', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.goto('/borrow')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: /borrow/i })).toBeVisible()
  await page.locator('input[name="collateralAmount"]').fill('0.1')
  await page.locator('input[name="borrowAmount"]').fill('10')
  await expect(page.getByRole('button', { name: /approve/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /borrow/i })).toBeVisible()
  await page.goto('/repay')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: /repay/i })).toBeVisible()
  await page.locator('input[name="repayAmount"]').fill('5')
  await expect(page.getByRole('button', { name: 'Repay', exact: true })).toBeVisible()
})

test('Liquidity staking actions are present', async ({ page }) => {
  await page.goto('/liquidity')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: /liquidity/i })).toBeVisible()
  await page.getByLabel(/amount/i).fill('1')
  await expect(page.getByRole('button', { name: /approve/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Stake', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unstake', exact: true })).toBeVisible()
})


