import bcrypt from 'bcryptjs';

async function hashPassword() {
  const password = process.argv[2];
  
  if (!password) {
    console.error('Usage: node scripts/hash-password.js <password>');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('\nHashed password:');
  console.log(hash);
  console.log('\nAdd this to your .env.local:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
}

hashPassword();