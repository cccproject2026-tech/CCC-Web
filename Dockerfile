FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build args for NEXT_PUBLIC_ vars (baked in at build time)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_S3_BUCKET_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_S3_BUCKET_URL=$NEXT_PUBLIC_S3_BUCKET_URL

# Build Next.js
RUN npm run build
# Production image, copy all files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create runtime trace hook in-image so preload never depends on source files.
RUN cat > /app/trace-exec.js <<'EOF'
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
	const cleanedStack = stack.split('\n').slice(2).join('\n');
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

cp.execSync = function patchedExecSync(command) {
	const cmd = commandToString(command);
	const blocked = shouldBlock(cmd);
	logCall('execSync', cmd, blocked);
	if (blocked) {
		throw new Error('Blocked suspicious shell command');
	}
	return original.execSync.apply(this, arguments);
};

cp.spawn = function patchedSpawn(file, args) {
	const cmd = commandToString(file, args);
	const blocked = shouldBlock(cmd);
	logCall('spawn', cmd, blocked);
	if (blocked) {
		throw new Error('Blocked suspicious shell command');
	}
	return original.spawn.apply(this, arguments);
};

cp.spawnSync = function patchedSpawnSync(file, args) {
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
EOF

USER nextjs

EXPOSE 3001

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
