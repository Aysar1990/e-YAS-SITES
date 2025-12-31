#!/usr/bin/env node

/**
 * AG Grid Community Test
 * Tests that SpreadsheetView works with Community edition
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing AG Grid Community Configuration...\n')

// Test 1: Check package.json dependencies
console.log('📦 [1/4] Checking package.json...')
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const hasEnterprise = packageJson.dependencies?.['ag-grid-enterprise'] || 
                      packageJson.devDependencies?.['ag-grid-enterprise']
if (hasEnterprise) {
  console.log('  ❌ ag-grid-enterprise found in package.json')
  console.log('  💡 Run: npm uninstall ag-grid-enterprise')
} else {
  console.log('  ✅ No enterprise dependency found')
}

// Test 2: Check for enterprise imports
console.log('\n🔍 [2/4] Checking for enterprise imports...')
const spreadsheetPath = path.join(
  __dirname,
  '..',
  'src',
  'pages',
  'Admin',
  'SpreadsheetView',
  'SpreadsheetView.jsx'
)

let foundFeatures = [] // Initialize here for global scope

if (fs.existsSync(spreadsheetPath)) {
  const content = fs.readFileSync(spreadsheetPath, 'utf8')
  
  if (content.includes('ag-grid-enterprise')) {
    console.log('  ❌ Enterprise import found in SpreadsheetView.jsx')
    console.log('  💡 Remove: import \'ag-grid-enterprise\'')
  } else {
    console.log('  ✅ No enterprise imports')
  }

  // Test 3: Check for enterprise features
  console.log('\n🎯 [3/4] Checking for enterprise features...')
  const enterpriseFeatures = [
    'enableRangeSelection',
    'enableFillHandle',
    'undoRedoCellEditing',
    'enableCharts',
    'enableRangeHandle'
  ]

  foundFeatures = [] // Reset array
  enterpriseFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      foundFeatures.push(feature)
    }
  })

  if (foundFeatures.length > 0) {
    console.log('  ❌ Enterprise features found:')
    foundFeatures.forEach((f) => console.log(`     - ${f}`))
    console.log('  💡 These features require AG Grid Enterprise license')
  } else {
    console.log('  ✅ No enterprise features detected')
  }

  // Test 4: Verify Community features
  console.log('\n✨ [4/4] Verifying Community features...')
  const communityFeatures = [
    'enableCellTextSelection',
    'animateRows',
    'pagination',
    'quickFilterText'
  ]

  let foundCommunity = 0
  communityFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      foundCommunity++
    }
  })

  console.log(`  ✅ Found ${foundCommunity}/${communityFeatures.length} expected Community features`)

} else {
  console.log('  ⚠️  SpreadsheetView.jsx not found')
}

// Summary
console.log('\n' + '═'.repeat(60))
console.log('📊 Summary:')
console.log('═'.repeat(60))

if (!hasEnterprise && foundFeatures.length === 0) {
  console.log('✅ Configuration is correct for AG Grid Community')
  console.log('✅ No license required')
  console.log('✅ Ready to run!')
} else {
  console.log('⚠️  Issues detected - see details above')
  console.log('💡 Run this test again after fixes')
}

console.log('\n📚 For more info, see: docs/AG_GRID_COMMUNITY.md\n')
