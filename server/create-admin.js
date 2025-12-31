#!/usr/bin/env node

/**
 * Create Admin User in Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createAdmin() {
  console.log('Creating admin user...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Try to insert admin user
  const { data, error } = await supabase
    .from('users')
    .upsert({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      is_active: 1,
      created_at: new Date().toISOString()
    }, { onConflict: 'username' })
    .select();

  if (error) {
    console.error('Error creating admin:', error);

    // Check if users table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('\nTrying to create users table...');
      // Table might not exist, try to get info
    }

    return;
  }

  console.log('Admin user created/updated successfully!');
  console.log('Username: admin');
  console.log('Password: 123456');
}

createAdmin().catch(console.error);
