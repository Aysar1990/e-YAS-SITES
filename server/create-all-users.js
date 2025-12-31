#!/usr/bin/env node

/**
 * Create All Users in Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const users = [
  // Admin
  { username: 'admin', password: 'admin123', role: 'admin' },
  
  // Nokia Engineers
  { username: 'Mofeed', password: 'Mofeed123', role: 'nokia_engineer' },
  { username: 'Laith', password: 'Laith123', role: 'nokia_engineer' },
  { username: 'Diyaa', password: 'Diyaa123', role: 'nokia_engineer' },
  { username: 'Najjar', password: 'Najjar123', role: 'nokia_engineer' },
  { username: 'Jehad', password: 'Jehad123', role: 'nokia_engineer' },
  
  // Management
  { username: 'Musab', password: 'Musab123', role: 'management' },
  { username: 'Monther', password: 'Monther123', role: 'management' },
  { username: 'Wazwaz', password: 'Wazwaz123', role: 'management' },
  { username: 'Anas', password: 'Anas123', role: 'management' },
  { username: 'Jawarneh', password: 'Jawarneh123', role: 'management' },
  
  // Contractors
  { username: 'Al Lewan', password: 'Al Lewan123', role: 'contractor', contractor_name: 'Al Lewan' },
  { username: 'Al Tawseaa', password: 'Al Tawseaa123', role: 'contractor', contractor_name: 'Al Tawseaa' },
  { username: 'R&D', password: 'R&D123', role: 'contractor', contractor_name: 'R&D' },
  { username: 'PIS', password: 'PIS123', role: 'contractor', contractor_name: 'PIS' },
];

async function createAllUsers() {
  console.log('Creating all users...\n');

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const { data, error } = await supabase
      .from('users')
      .upsert({
        username: user.username,
        password: hashedPassword,
        role: user.role,
        contractor_name: user.contractor_name || null,
        is_active: 1,
        created_at: new Date().toISOString()
      }, { onConflict: 'username' })
      .select();

    if (error) {
      console.log(`❌ ${user.username}: ${error.message}`);
    } else {
      console.log(`✅ ${user.username} (${user.role}) - Password: ${user.password}`);
    }
  }

  console.log('\n✅ Done!');
}

createAllUsers().catch(console.error);
