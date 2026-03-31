const ftp = require('basic-ftp');
require('dotenv').config({ path: './server/.env' });

async function discover() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });

    console.log('--- FTP ROOT LIST ---');
    const rootList = await client.list();
    rootList.forEach(f => console.log(`${f.type === 2 ? '[DIR]' : '[FILE]'} ${f.name}`));

    // Try common paths
    const pathsToTry = [
      'domains/srmclasses.in/public_html/uploads',
      'public_html/uploads',
      'uploads'
    ];

    for (const p of pathsToTry) {
      try {
        await client.cd('/');
        await client.cd(p);
        console.log(`✅ SUCCESS: Path "${p}" is valid.`);
        const files = await client.list();
        console.log(`   Found ${files.length} files in ${p}`);
      } catch (e) {
        console.log(`❌ FAILED: Path "${p}" is invalid. Error: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    client.close();
  }
}

discover();
