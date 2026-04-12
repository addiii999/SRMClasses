const bcrypt = require('bcryptjs');

const pass1 = "SupermanAa-chuss143";
const hash1 = "$2a$12$VGAXFfBELY6rMCycTc7zTe0CF9Zk0H.C14.NxhdC8GG6JJqq16l1W";

const pass2 = "AdityaAdmin@9798";
const hash2 = "$2a$12$qllLj4mNG7elwqbglRWULOxE0votmAz1.nFBow58uOWQMfda.57mm";

async function testMatch() {
  const match1 = await bcrypt.compare(pass1, hash1);
  console.log(`SupermanAa-chuss143 match: ${match1}`);

  const match2 = await bcrypt.compare(pass2, hash2);
  console.log(`AdityaAdmin@9798 match: ${match2}`);
}

testMatch();
