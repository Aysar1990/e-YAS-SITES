#!/usr/bin/env node

/**
 * Unify Contractor Names in Supabase
 *
 * Updates tssr_subcon to match registered user contractor_name
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapping: old names -> new unified name
const CONTRACTOR_MAPPINGS = {
  // Al Lewan variations -> "Al Lewan"
  'Al-Lewan': 'Al Lewan',
  'AL-LEWAN FOR CONSTRUCTIVE CONT': 'Al Lewan',

  // Al Tawseaa variations -> "Al Tawseaa"
  'Al Tawseea': 'Al Tawseaa',
  'Al-Tawseaa': 'Al Tawseaa',
};

async function unifyContractors() {
  console.log('\n========================================');
  console.log('   UNIFY CONTRACTOR NAMES');
  console.log('========================================\n');

  let totalUpdated = 0;

  for (const [oldName, newName] of Object.entries(CONTRACTOR_MAPPINGS)) {
    console.log(`\nUpdating: "${oldName}" -> "${newName}"`);

    try {
      // First count how many will be updated
      const { count, error: countError } = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('tssr_subcon', oldName);

      if (countError) {
        console.error(`  Error counting: ${countError.message}`);
        continue;
      }

      console.log(`  Found: ${count} sites`);

      if (count === 0) {
        console.log(`  Skipping - no sites found`);
        continue;
      }

      // Update the records
      const { data, error } = await supabase
        .from('sites')
        .update({ tssr_subcon: newName })
        .eq('tssr_subcon', oldName)
        .select('site_id');

      if (error) {
        console.error(`  Error updating: ${error.message}`);
        continue;
      }

      const updatedCount = data?.length || 0;
      console.log(`  Updated: ${updatedCount} sites`);
      totalUpdated += updatedCount;

    } catch (err) {
      console.error(`  Exception: ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log(`   TOTAL UPDATED: ${totalUpdated} sites`);
  console.log('========================================\n');

  // Verify final state
  console.log('Verifying final contractor distribution...\n');

  const { data: finalData, error: finalError } = await supabase
    .from('sites')
    .select('tssr_subcon')
    .not('tssr_subcon', 'is', null)
    .not('tssr_subcon', 'eq', '');

  if (!finalError && finalData) {
    const counts = {};
    finalData.forEach(row => {
      const name = row.tssr_subcon;
      counts[name] = (counts[name] || 0) + 1;
    });

    console.log('Final contractor distribution:');
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        console.log(`  - "${name}": ${count} sites`);
      });
  }

  console.log('\nDone!\n');
}

// Run
unifyContractors().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
