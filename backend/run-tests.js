import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jestPath = join(__dirname, 'node_modules', 'jest', 'bin', 'jest.js');
const args = ['--experimental-vm-modules', '--no-warnings', jestPath, '--runInBand', ...process.argv.slice(2)];

const child = spawn('node', args, {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('exit', (code) => {
  process.exit(code);
});
