const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('hidalgo123', 10);
console.log(hash);
