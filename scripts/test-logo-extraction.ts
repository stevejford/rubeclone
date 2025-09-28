#!/usr/bin/env tsx

/**
 * Test script to verify logo extraction and fallback logic
 */

import { extractAppLogo, generateAppIcon, getOptimizedLogoUrl, getLogoQuality } from '../lib/utils/marketplace-helpers'

// Test data simulating different app scenarios
const testApps = [
  {
    name: 'Gmail',
    slug: 'gmail',
    meta: { logo: 'https://logos.composio.dev/api/gmail' }
  },
  {
    name: 'Frisk',
    slug: 'frisk',
    meta: { logo: 'https://logos.composio.dev/api/frisk' }
  },
  {
    name: 'Test App',
    slug: 'test-app',
    meta: { logo: 'https://broken-url.com/logo.png' }
  },
  {
    name: 'No Logo App',
    slug: 'no-logo-app',
    meta: {}
  },
  {
    name: 'External Logo App',
    slug: 'external-logo',
    meta: { logo: 'https://example.com/logo.svg' }
  }
]

console.log('🧪 Testing Logo Extraction System')
console.log('=' .repeat(60))

testApps.forEach((app, index) => {
  console.log(`\n${index + 1}. Testing: ${app.name}`)
  console.log(`   Slug: ${app.slug}`)
  console.log(`   Original Logo: ${app.meta.logo || 'None'}`)
  
  // Test extraction
  const extractedLogo = extractAppLogo(app)
  console.log(`   Extracted Logo: ${extractedLogo || 'None'}`)
  
  // Test optimization
  const optimizedLogo = getOptimizedLogoUrl(app as any)
  console.log(`   Optimized Logo: ${optimizedLogo}`)
  
  // Test quality assessment
  const quality = getLogoQuality(extractedLogo)
  console.log(`   Quality: ${quality}`)
  
  // Test fallback generation
  const fallbackLogo = generateAppIcon(app.name)
  console.log(`   Fallback Logo: ${fallbackLogo}`)
})

console.log('\n🎯 Testing Fallback Icon Generation')
console.log('=' .repeat(60))

const testNames = [
  'Gmail',
  'Frisk',
  'Test App',
  'Single',
  'Multi Word App Name',
  'App123!@#',
  '',
  'A',
  'AB'
]

testNames.forEach(name => {
  const icon = generateAppIcon(name)
  console.log(`"${name}" -> ${icon}`)
})

console.log('\n✅ Logo extraction testing complete!')
