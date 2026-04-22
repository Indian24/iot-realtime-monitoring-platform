#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function removeIfExists(relPath) {
  const p = path.join(process.cwd(), relPath);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('removed', relPath);
    }
  } catch (err) {
    console.error('failed to remove', relPath, err.message);
  }
}

removeIfExists('package-lock.json');
removeIfExists('yarn.lock');

const userAgent = process.env.npm_config_user_agent || '';
if (!userAgent.startsWith('pnpm/')) {
  console.error('Use pnpm instead of npm or yarn to install this workspace. Detected:', userAgent || '<unknown>');
  process.exit(1);
}

console.log('preinstall check passed.');