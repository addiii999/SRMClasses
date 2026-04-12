const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('\x1b[31m%s\x1b[0m', 'Usage: node server/scripts/generateHash.js "your_password"');
  process.exit(1);
}

// ─── Password Strength Validation ───────────────────────────────────────────
const validate = (pwd) => {
  const minLength = 8;
  const hasNumber = /\d/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

  if (pwd.length < minLength) return 'Password must be at least 8 characters long.';
  if (!hasNumber) return 'Password must contain at least one number.';
  if (!hasSpecial) return 'Password must contain at least one special character.';
  
  return null;
};

const error = validate(password);
if (error) {
  console.log('\x1b[31m%s\x1b[0m', `❌ INVALID PASSWORD: ${error}`);
  process.exit(1);
}

// ─── Hash Generation ────────────────────────────────────────────────────────
const saltRounds = 12;

console.log('\x1b[36m%s\x1b[0m', '🔄 Generating secure hash...');

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  
  console.log('\x1b[32m%s\x1b[0m', '✅ HASH GENERATED SUCCESSFULLY:');
  console.log('--------------------------------------------------');
  console.log(hash);
  console.log('--------------------------------------------------');
  console.log('\x1b[33m%s\x1b[0m', 'Copy the hash above and paste it into your .env file.');
});
