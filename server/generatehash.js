// Generate hash (run in Node.js locally)
const bcrypt = require('bcryptjs');

bcrypt.hash('Admin123!', 12).then(hash => console.log(hash));