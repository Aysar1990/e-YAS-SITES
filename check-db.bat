@echo off
chcp 65001 >nul
title Database Status
color 0F

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║         Database Status               ║
echo  ╚═══════════════════════════════════════╝
echo.

node -e "const Database=require('better-sqlite3');try{const db=new Database('./data/tssr.db');const sites=db.prepare('SELECT COUNT(*) as c FROM sites').get();console.log('=== Sites Table ===');console.log('Total Records:',sites.c);console.log('');const phases=db.prepare('SELECT phase_name,COUNT(*) as cnt FROM sites GROUP BY phase_name ORDER BY cnt DESC').all();console.log('By Phase:');phases.forEach(p=>console.log('  '+p.phase_name+': '+p.cnt));console.log('');const uniqueSites=db.prepare('SELECT COUNT(DISTINCT site_id) as c FROM sites').get();console.log('Unique Site IDs:',uniqueSites.c);console.log('');const sample=db.prepare('SELECT site_id,final_site_name,phase_name FROM sites LIMIT 3').all();console.log('Sample Data:');sample.forEach(s=>console.log('  ['+s.site_id+'] '+s.final_site_name+' ('+s.phase_name+')'));db.close();console.log('');console.log('Database OK!')}catch(e){console.log('Error:',e.message)}"

echo.
pause
