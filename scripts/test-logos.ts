#!/usr/bin/env tsx

/**
 * Script to test and analyze Composio app logos
 * This script fetches app data and analyzes logo quality
 */

import { promises as fs } from 'fs'
import path from 'path'

interface LogoAnalysis {
  name: string
  slug: string
  logoUrl?: string
  logoQuality: 'high' | 'medium' | 'low' | 'generated'
  logoSource: 'composio-api' | 'open-logos-cdn' | 'external' | 'favicon' | 'generated'
  fileSize?: number
  dimensions?: string
  error?: string
}

/**
 * Analyze logo quality and source
 */
function analyzeLogo(logoUrl?: string): { quality: LogoAnalysis['logoQuality'], source: LogoAnalysis['logoSource'] } {
  if (!logoUrl) return { quality: 'generated', source: 'generated' }
  
  if (logoUrl.includes('ui-avatars.com')) return { quality: 'generated', source: 'generated' }
  if (logoUrl.includes('logos.composio.dev/api/')) return { quality: 'high', source: 'composio-api' }
  if (logoUrl.includes('cdn.jsdelivr.net/gh/ComposioHQ/open-logos')) return { quality: 'high', source: 'open-logos-cdn' }
  if (logoUrl.includes('.svg')) return { quality: 'high', source: 'external' }
  if (logoUrl.includes('favicon.ico')) return { quality: 'low', source: 'favicon' }
  if (logoUrl.includes('.png') || logoUrl.includes('.jpg') || logoUrl.includes('.jpeg')) return { quality: 'medium', source: 'external' }
  
  return { quality: 'medium', source: 'external' }
}

/**
 * Fetch logo metadata
 */
async function fetchLogoMetadata(logoUrl: string): Promise<{ fileSize?: number, dimensions?: string, error?: string }> {
  try {
    const response = await fetch(logoUrl, { method: 'HEAD' })
    if (!response.ok) {
      return { error: `HTTP ${response.status}` }
    }
    
    const contentLength = response.headers.get('content-length')
    const contentType = response.headers.get('content-type')
    
    return {
      fileSize: contentLength ? parseInt(contentLength) : undefined,
      dimensions: contentType || undefined
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Main function to analyze logos
 */
async function analyzeLogos() {
  console.log('🔍 Fetching Composio apps...')
  
  try {
    // Fetch apps from Composio API
    const response = await fetch('https://mcp.composio.dev/api/apps/list')
    if (!response.ok) {
      throw new Error(`Failed to fetch apps: ${response.status}`)
    }
    
    const data = await response.json()
    const apps = data.items || []
    
    console.log(`📊 Found ${apps.length} apps. Analyzing logos...`)
    
    const analyses: LogoAnalysis[] = []
    
    // Analyze first 20 apps for testing
    const sampleApps = apps.slice(0, 20)
    
    for (const app of sampleApps) {
      const logoUrl = app.meta?.logo
      const { quality, source } = analyzeLogo(logoUrl)
      
      const analysis: LogoAnalysis = {
        name: app.name,
        slug: app.slug,
        logoUrl,
        logoQuality: quality,
        logoSource: source
      }
      
      // Fetch metadata for non-generated logos
      if (logoUrl && source !== 'generated') {
        console.log(`  📸 Analyzing ${app.name}...`)
        const metadata = await fetchLogoMetadata(logoUrl)
        Object.assign(analysis, metadata)
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      analyses.push(analysis)
    }
    
    // Generate report
    console.log('\n📈 Logo Quality Report:')
    console.log('=' .repeat(80))
    
    const qualityCounts = {
      high: analyses.filter(a => a.logoQuality === 'high').length,
      medium: analyses.filter(a => a.logoQuality === 'medium').length,
      low: analyses.filter(a => a.logoQuality === 'low').length,
      generated: analyses.filter(a => a.logoQuality === 'generated').length
    }
    
    const sourceCounts = {
      'composio-api': analyses.filter(a => a.logoSource === 'composio-api').length,
      'open-logos-cdn': analyses.filter(a => a.logoSource === 'open-logos-cdn').length,
      'external': analyses.filter(a => a.logoSource === 'external').length,
      'favicon': analyses.filter(a => a.logoSource === 'favicon').length,
      'generated': analyses.filter(a => a.logoSource === 'generated').length
    }
    
    console.log('\n🎯 Quality Distribution:')
    Object.entries(qualityCounts).forEach(([quality, count]) => {
      const percentage = ((count / analyses.length) * 100).toFixed(1)
      console.log(`  ${quality.padEnd(10)}: ${count.toString().padStart(2)} (${percentage}%)`)
    })
    
    console.log('\n🔗 Source Distribution:')
    Object.entries(sourceCounts).forEach(([source, count]) => {
      const percentage = ((count / analyses.length) * 100).toFixed(1)
      console.log(`  ${source.padEnd(15)}: ${count.toString().padStart(2)} (${percentage}%)`)
    })
    
    console.log('\n📋 Detailed Analysis:')
    analyses.forEach(analysis => {
      const sizeInfo = analysis.fileSize ? ` (${(analysis.fileSize / 1024).toFixed(1)}KB)` : ''
      const errorInfo = analysis.error ? ` ❌ ${analysis.error}` : ''
      console.log(`  ${analysis.name.padEnd(20)} | ${analysis.logoQuality.padEnd(8)} | ${analysis.logoSource.padEnd(15)}${sizeInfo}${errorInfo}`)
    })
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'logo-analysis-report.json')
    await fs.writeFile(reportPath, JSON.stringify(analyses, null, 2))
    console.log(`\n💾 Detailed report saved to: ${reportPath}`)
    
    // High-quality logo examples
    const highQualityLogos = analyses.filter(a => a.logoQuality === 'high' && a.logoUrl)
    console.log('\n✨ High-Quality Logo Examples:')
    highQualityLogos.slice(0, 5).forEach(analysis => {
      console.log(`  ${analysis.name}: ${analysis.logoUrl}`)
    })
    
  } catch (error) {
    console.error('❌ Error analyzing logos:', error)
    process.exit(1)
  }
}

// Run the analysis
if (require.main === module) {
  analyzeLogos()
}
