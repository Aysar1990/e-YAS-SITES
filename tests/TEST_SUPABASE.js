const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Checking Supabase Data (Correct Keys)...\n');

const supabaseUrl = 'https://kszdatqbykpodxmnfzfg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzemRhdHFieWtwb2R4bW5memZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUxOTExOSwiZXhwIjoyMDUyMDk1MTE5fQ.j7e_mUVwD6CvqUnCqZ1XFO90l5BGdI8Jm-rZzZIyVzk';

async function checkData() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase\n');

    // Count total sites
    const { count, error } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 Total Sites in Supabase:', count);

    if (count > 0) {
      // Get sample data
      const { data: sample, error: sampleError } = await supabase
        .from('sites')
        .select('site_id, final_site_name, phase_name, tssr_overall_status')
        .limit(5);

      if (!sampleError) {
        console.log('\n📄 Sample Data:');
        sample.forEach(s => {
          console.log(`  ${s.site_id} - ${s.final_site_name} [${s.phase_name}] - ${s.tssr_overall_status}`);
        });
      }

      // Get phases
      const { data: phases, error: phasesError } = await supabase
        .from('sites')
        .select('phase_name');

      if (!phasesError && phases) {
        const phaseCount = {};
        phases.forEach(p => {
          if (p.phase_name) {
            phaseCount[p.phase_name] = (phaseCount[p.phase_name] || 0) + 1;
          }
        });

        console.log('\n📋 Phases:');
        Object.entries(phaseCount).forEach(([phase, cnt]) => {
          console.log(`  ${phase}: ${cnt} sites`);
        });
      }
    }

    console.log('\n✅ Complete!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkData();
