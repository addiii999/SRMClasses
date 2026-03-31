require('dotenv').config({ path: './.env' });
const ftp = require('basic-ftp');
const fs = require('fs');

async function discoverPath() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false,
        });
        
        const paths = [
            { id: 1, path: '/public_html/uploads' },
            { id: 2, path: '/uploads' },
            { id: 3, path: '/domains/srmclasses.in/public_html/uploads' },
            { id: 4, path: '/public_html/public_html/uploads' }
        ];

        for (const p of paths) {
            const fileName = `find-me-${p.id}.txt`;
            const content = `Target Path ID: ${p.id} (${p.path})`;
            fs.writeFileSync(`./${fileName}`, content);
            
            try {
                await client.cd('/');
                await client.ensureDir(p.path);
                await client.uploadFrom(`./${fileName}`, fileName);
                console.log(`Uploaded find-me-${p.id}.txt to ${p.path}`);
            } catch(e) {
                console.log(`Failed to upload to ${p.path}`);
            }
            if (fs.existsSync(`./${fileName}`)) fs.unlinkSync(`./${fileName}`);
        }
        
    } catch (err) {
        console.error('Discovery failed:', err);
    } finally {
        client.close();
    }
}

discoverPath();
