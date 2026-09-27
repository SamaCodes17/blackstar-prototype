import { randomBytes, scryptSync } from 'node:crypto';
// Read from standard input, never a command-line argument or shell history.
let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.trimEnd();
if (password.length < 16 || password.length > 256)
  throw new Error('Use a unique password of 16–256 characters');
const salt = randomBytes(16).toString('hex');
console.log(salt + ':' + scryptSync(password, salt, 64).toString('hex'));
