#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// Configuración de iconos PWA
const ICON_SIZES = [
  72, 96, 128, 144, 152, 192, 384, 512
]

// Configuración de splash screens para iOS
const SPLASH_SCREENS = [
  { width: 640, height: 1136, device: 'iPhone 5/SE' },
  { width: 750, height: 1334, device: 'iPhone 6/7/8' },
  { width: 1242, height: 2208, device: 'iPhone 6/7/8 Plus' },
  { width: 1125, height: 2436, device: 'iPhone X/XS' },
  { width: 828, height: 1792, device: 'iPhone XR' },
  { width: 1242, height: 2688, device: 'iPhone XS Max' },
  { width: 1536, height: 2048, device: 'iPad' },
  { width: 1668, height: 2388, device: 'iPad Pro 11' },
  { width: 2048, height: 2732, device: 'iPad Pro 12.9' }
]

// Configuración de badges
const BADGE_SIZES = [96, 128]

// Colores del tema
const THEME_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#0f172a',
  surface: '#1e293b'
}

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

async function generateIcon(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    
    console.log(`✅ Generated icon: ${size}x${size}`)
  } catch (error) {
    console.error(`❌ Error generating ${size}x${size} icon:`, error)
  }
}

async function generateSplashScreen(inputPath, outputPath, width, height, device) {
  try {
    // Crear un fondo con gradiente
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
    .png()
    .toBuffer()

    // Redimensionar el logo
    const logoSize = Math.min(width, height) * 0.3
    const logo = await sharp(inputPath)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer()

    // Combinar fondo y logo
    await sharp(background)
      .composite([{
        input: logo,
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath)

    console.log(`✅ Generated splash screen: ${width}x${height} (${device})`)
  } catch (error) {
    console.error(`❌ Error generating splash screen ${width}x${height}:`, error)
  }
}

async function generateBadge(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    
    console.log(`✅ Generated badge: ${size}x${size}`)
  } catch (error) {
    console.error(`❌ Error generating ${size}x${size} badge:`, error)
  }
}

async function generateOGImage(inputPath, outputPath) {
  try {
    const width = 1200
    const height = 630

    // Crear fondo con gradiente
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
    .png()
    .toBuffer()

    // Redimensionar el logo
    const logo = await sharp(inputPath)
      .resize(200, 200)
      .png()
      .toBuffer()

    // Crear texto SVG
    const textSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="url(#grad)">DeFi Core</text>
        <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="#94a3b8">Plataforma Financiera Descentralizada</text>
      </svg>
    `

    const textBuffer = Buffer.from(textSvg)

    // Combinar todo
    await sharp(background)
      .composite([
        {
          input: logo,
          gravity: 'northwest',
          top: 50,
          left: 50
        },
        {
          input: textBuffer,
          gravity: 'center'
        }
      ])
      .png()
      .toFile(outputPath)

    console.log(`✅ Generated OG image: 1200x630`)
  } catch (error) {
    console.error(`❌ Error generating OG image:`, error)
  }
}

async function generateTwitterImage(inputPath, outputPath) {
  try {
    const width = 1200
    const height = 600

    // Similar al OG image pero con dimensiones de Twitter
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
    .png()
    .toBuffer()

    const logo = await sharp(inputPath)
      .resize(180, 180)
      .png()
      .toBuffer()

    const textSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="url(#grad)">DeFi Core</text>
        <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#94a3b8">Finanzas Descentralizadas</text>
      </svg>
    `

    const textBuffer = Buffer.from(textSvg)

    await sharp(background)
      .composite([
        {
          input: logo,
          gravity: 'northwest',
          top: 40,
          left: 40
        },
        {
          input: textBuffer,
          gravity: 'center'
        }
      ])
      .png()
      .toFile(outputPath)

    console.log(`✅ Generated Twitter image: 1200x600`)
  } catch (error) {
    console.error(`❌ Error generating Twitter image:`, error)
  }
}

async function updateManifest() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json')
    
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      
      // Actualizar versiones de cache
      const timestamp = Date.now()
      manifest.version = `1.0.${timestamp}`
      
      // Actualizar rutas de iconos
      manifest.icons = ICON_SIZES.map(size => ({
        src: `/assets/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'maskable any'
      }))

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      console.log('✅ Updated manifest.json')
    }
  } catch (error) {
    console.error('❌ Error updating manifest:', error)
  }
}

async function main() {
  console.log('🚀 Generating PWA assets...\n')

  const inputLogo = path.join(process.cwd(), 'src', 'assets', 'Logo2.svg')
  const outputDir = path.join(process.cwd(), 'public', 'assets')

  // Verificar que existe el logo de entrada
  if (!fs.existsSync(inputLogo)) {
    console.error('❌ Input logo not found:', inputLogo)
    process.exit(1)
  }

  // Crear directorio de salida
  await ensureDirectoryExists(outputDir)

  // Generar iconos
  console.log('📱 Generating icons...')
  for (const size of ICON_SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
    await generateIcon(inputLogo, outputPath, size)
  }

  // Generar splash screens
  console.log('\n🖼️  Generating splash screens...')
  for (const screen of SPLASH_SCREENS) {
    const outputPath = path.join(outputDir, `splash-${screen.width}x${screen.height}.png`)
    await generateSplashScreen(inputLogo, outputPath, screen.width, screen.height, screen.device)
  }

  // Generar badges
  console.log('\n🏷️  Generating badges...')
  for (const size of BADGE_SIZES) {
    const outputPath = path.join(outputDir, `badge-${size}x${size}.png`)
    await generateBadge(inputLogo, outputPath, size)
  }

  // Generar imágenes para redes sociales
  console.log('\n📢 Generating social media images...')
  await generateOGImage(inputLogo, path.join(outputDir, 'og-image.png'))
  await generateTwitterImage(inputLogo, path.join(outputDir, 'twitter-image.png'))

  // Actualizar manifest
  console.log('\n📄 Updating manifest...')
  await updateManifest()

  console.log('\n🎉 PWA assets generation completed!')
  console.log('\n📋 Next steps:')
  console.log('1. Add the generated assets to your public/assets directory')
  console.log('2. Update your manifest.json with the correct icon paths')
  console.log('3. Test your PWA with Lighthouse')
  console.log('4. Deploy and enjoy your mobile-optimized DeFi app!')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  generateIcon,
  generateSplashScreen,
  generateBadge,
  generateOGImage,
  generateTwitterImage,
  updateManifest
}
