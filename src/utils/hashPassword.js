const bcrypt = require('bcryptjs');

const password = process.argv[2]; // pass password as CLI argument
if (!password) {
  console.log("Usage: node hashPassword.js <your-password>");
  process.exit(1);
}

const saltRounds = 10;
bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error("Error hashing password:", err);
  } else {
    console.log("Hashed password:");
    console.log(hash);
  }
});
//Command e.g= node srcnode src/hashPasswords.js 12345/hashPasswords.js 12345