import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';

// This key is authorized only for the fixed, single-use receiver on the EC2 host.
const archive = resolve('deployment-artifacts/athena-ec2-release.zip');
const privateKey = process.argv[2];
if (!privateKey) throw new Error('Supply the local temporary private-key path.');
const expectedHash = 'a4f4db820e36e0a86b48c8d3d719de19e3d76caf4fe8f467b4d20ccff80841bc';
const hostPublicKey = 'AAAAC3NzaC1lZDI1NTE5AAAAIMHgcxg/WtuG8Xd0xDL4Ovfo6z8MK8X9nQ9qojg8rn68';
const fingerprint = 'SHA256:' + createHash('sha256').update(Buffer.from(hostPublicKey, 'base64')).digest('base64').replace(/=+$/, '');
if (fingerprint !== 'SHA256:AsTe/L4fe1ICwaxXqRyB2XqYD6bOniQYo9U/hE5aPoU') throw new Error('Server host-key fingerprint mismatch.');
if ((await stat(archive)).size !== 920106) throw new Error('Archive size differs from the authorized release.');
if (createHash('sha256').update(await readFile(archive)).digest('hex') !== expectedHash) throw new Error('Archive hash differs from the authorized release.');
await stat(privateKey);
const transferDir = await mkdtemp(join(tmpdir(), 'athena-pinned-upload-'));
const knownHosts = join(transferDir, 'known_hosts');
await writeFile(knownHosts, `athena.joelalfred.me ssh-ed25519 ${hostPublicKey}\n`, { mode: 0o600 });
console.log(`Verified archive: 920106 bytes, SHA256 ${expectedHash}`);
console.log(`Pinned server identity: ${fingerprint}`);
const ssh = spawn('C:/Windows/System32/OpenSSH/ssh.exe', [
  '-F', 'NUL', '-T', '-p', '22', '-i', privateKey,
  '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
  '-o', 'StrictHostKeyChecking=yes', '-o', `UserKnownHostsFile=${knownHosts}`,
  '-o', 'HostKeyAlgorithms=ssh-ed25519', '-o', 'ClearAllForwardings=yes',
  '-o', 'ConnectTimeout=15', '-o', 'ConnectionAttempts=1',
  'admin@athena.joelalfred.me',
], { stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
const source = createReadStream(archive);
source.on('error', error => { console.error(error.message); ssh.kill(); });
ssh.stdin.on('error', error => { if (error.code !== 'EPIPE') console.error(error.message); });
source.pipe(ssh.stdin);
const exitCode = await new Promise((accept, reject) => { ssh.once('error', reject); ssh.once('close', code => { source.destroy(); accept(code ?? 1); }); });
console.log(`Restricted SSH receiver exit code: ${exitCode}`);
process.exitCode = exitCode;
