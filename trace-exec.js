'use strict';

const cp = require('node:child_process');

const SUSPICIOUS = [
  /\bwget\b/i,
  /\bcurl\b/i,
  /base64\s*-d/i,
  /\|\s*sh\b/i,
  /\bpkill\b/i,
  /\bkill\s+-9\b/i,
  /\/tmp\/.+\/(javae|\.XIN-unix|\.ICEi-unix)/i,
  /221\.156\.167\.200/i,
];

function commandToString(fileOrCmd, args) {
  if (Array.isArray(args) && args.length > 0) {
    return [String(fileOrCmd), ...args.map((a) => String(a))].join(' ');
  }
  return String(fileOrCmd || '');
}

function isSuspicious(cmd) {
  return SUSPICIOUS.some((re) => re.test(cmd));
}

function logCall(kind, cmd, blocked) {
  const prefix = blocked ? '[TRACE-EXEC][BLOCKED]' : '[TRACE-EXEC][CALL]';
  const stack = new Error().stack || '';
  const cleanedStack = stack
    .split('\n')
    .slice(2)
    .join('\n');
  console.error(prefix + ' ' + kind + ' => ' + cmd);
  console.error('[TRACE-EXEC][STACK]\n' + cleanedStack);
}

function shouldBlock(cmd) {
  return process.env.BLOCK_SUSPICIOUS_SHELL !== '0' && isSuspicious(cmd);
}

const original = {
  exec: cp.exec,
  execSync: cp.execSync,
  spawn: cp.spawn,
  spawnSync: cp.spawnSync,
};

cp.exec = function patchedExec(command, options, callback) {
  const cmd = commandToString(command);
  const blocked = shouldBlock(cmd);
  logCall('exec', cmd, blocked);
  if (blocked) {
    const err = new Error('Blocked suspicious shell command');
    if (typeof options === 'function') {
      options(err, '', '');
      return;
    }
    if (typeof callback === 'function') {
      callback(err, '', '');
      return;
    }
    throw err;
  }
  return original.exec.apply(this, arguments);
};

cp.execSync = function patchedExecSync(command, options) {
  const cmd = commandToString(command);
  const blocked = shouldBlock(cmd);
  logCall('execSync', cmd, blocked);
  if (blocked) {
    throw new Error('Blocked suspicious shell command');
  }
  return original.execSync.apply(this, arguments);
};

cp.spawn = function patchedSpawn(file, args, options) {
  const cmd = commandToString(file, args);
  const blocked = shouldBlock(cmd);
  logCall('spawn', cmd, blocked);
  if (blocked) {
    throw new Error('Blocked suspicious shell command');
  }
  return original.spawn.apply(this, arguments);
};

cp.spawnSync = function patchedSpawnSync(file, args, options) {
  const cmd = commandToString(file, args);
  const blocked = shouldBlock(cmd);
  logCall('spawnSync', cmd, blocked);
  if (blocked) {
    return {
      pid: 0,
      output: [Buffer.from(''), Buffer.from(''), Buffer.from('Blocked suspicious shell command')],
      stdout: Buffer.from(''),
      stderr: Buffer.from('Blocked suspicious shell command'),
      status: 1,
      signal: null,
    };
  }
  return original.spawnSync.apply(this, arguments);
};
