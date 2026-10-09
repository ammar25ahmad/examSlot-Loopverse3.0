/* eslint-disable no-console */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.LOG_LEVEL
  ? levels[process.env.LOG_LEVEL] ?? levels.info
  : process.env.NODE_ENV === 'test'
    ? levels.error
    : levels.info;

function stamp() {
  return new Date().toISOString();
}

export const logger = {
  error(...args) {
    if (currentLevel >= levels.error) console.error(`[${stamp()}] ERROR`, ...args);
  },
  warn(...args) {
    if (currentLevel >= levels.warn) console.warn(`[${stamp()}] WARN `, ...args);
  },
  info(...args) {
    if (currentLevel >= levels.info) console.log(`[${stamp()}] INFO `, ...args);
  },
  debug(...args) {
    if (currentLevel >= levels.debug) console.log(`[${stamp()}] DEBUG`, ...args);
  },
};

export default logger;
