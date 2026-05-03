const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('Seeding passwords...');
        const plainPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        
        await pool.query('UPDATE users SET password = ?', [hashedPassword]);
        
        console.log('Admin & User passwords updated to: password123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seed();
