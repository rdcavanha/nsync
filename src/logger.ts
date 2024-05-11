import fs from 'fs';
import chalk, { type ChalkInstance } from 'chalk';
import dayjs from 'dayjs';
import path from 'path';

type LogType = 'copy' | 'delete' | 'info' | 'error';

const logTypeColors: Record<LogType, ChalkInstance> = {
  copy: chalk.green,
  delete: chalk.yellow,
  info: chalk.blueBright,
  error: chalk.red,
};

const logTypeConsoleFn: Record<LogType, (...args: unknown[]) => void> = {
  copy: console.log,
  delete: console.warn,
  info: console.info,
  error: console.error,
};

const log =
  (type: LogType, filename: string) =>
  (...args: unknown[]) => {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const prefix = `${timestamp} [${type}]:`;
    logTypeConsoleFn[type](logTypeColors[type](prefix), ...args);

    fs.appendFileSync(filename, prefix.concat(' '));
    args.forEach((arg) => {
      const message = typeof arg === 'object' ? JSON.stringify(arg) : arg;
      fs.appendFileSync(filename, `${message} `);
    });
    fs.appendFileSync(filename, '\n');
  };

type Logger = Record<LogType, (...args: unknown[]) => void>;

export const logger = ((): Logger => {
  try {
    fs.mkdirSync('log');
  } catch (e) {}
  const filename = path.join('log', dayjs().format('YYYYMMDD-HHmmss').concat('.log'));
  return {
    copy: (...args) => log('copy', filename)(...args),
    delete: (...args) => log('delete', filename)(...args),
    info: (...args) => log('info', filename)(...args),
    error: (...args) => log('error', filename)(...args),
  };
})();
