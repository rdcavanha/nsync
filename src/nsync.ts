import arg from 'arg';
import fs from 'fs';
import path from 'path';
import { compareItem, copy, remove } from './item.js';
import { logger } from './logger.js';
import { config, type CompareType, type Config } from './utils.js';

type BackupProps = Required<Pick<Config, 'excludeRegex'>> &
  Pick<Config, 'autoCompareBySizeThreshold'> & {
    src: string;
    dest: string;
    compare?: CompareType;
  };

const backup = async ({ src, dest, excludeRegex, compare, autoCompareBySizeThreshold }: BackupProps) => {
  const srcItems = fs.readdirSync(src);

  for (const item of srcItems) {
    const srcItem = path.join(src, item);
    const destItem = path.join(dest, item);

    const isExcluded = excludeRegex.find((it) => new RegExp(it).test(srcItem));
    if (isExcluded) {
      logger.info('Skipping excluded item', srcItem);
      continue;
    }

    const stats = fs.lstatSync(srcItem);
    if (stats.isDirectory()) {
      await backup({ src: srcItem, dest: destItem, excludeRegex, compare, autoCompareBySizeThreshold });
      continue;
    }

    logger.info('Processing', srcItem, destItem);

    if (!fs.existsSync(destItem)) {
      copy(srcItem, destItem);
      continue;
    }

    const isSameItem = await compareItem({ compare, srcItem, destItem, autoCompareBySizeThreshold });

    if (!isSameItem) {
      copy(srcItem, destItem);
      logger.info('Items are the same, do nothing');
    }
  }
};

type CleanupProps = Required<Pick<Config, 'excludeRegex'>> & {
  src: string;
  dest: string;
};

const cleanup = async ({ src, dest, excludeRegex }: CleanupProps) => {
  const destItems = fs.readdirSync(dest);

  for (const file of destItems) {
    const srcItem = path.join(src, file);
    const destItem = path.join(dest, file);

    logger.info('Checking if file exists in source', destItem);

    if (!fs.existsSync(srcItem)) {
      remove(destItem);
      continue;
    }

    const isExcluded = excludeRegex.find((it) => new RegExp(it).test(destItem));
    if (isExcluded) {
      remove(destItem);
      continue;
    }

    const stats = fs.lstatSync(destItem);
    if (stats.isDirectory()) {
      cleanup({ src: srcItem, dest: destItem, excludeRegex });
      continue;
    }
  }
};

(async () => {
  const args = arg({
    '--id': [String],
  });
  const ids = args['--id'];
  const filteredSync = ids ? config.sync.filter((it) => ids.includes(it.id)) : config.sync;

  for (const sync of filteredSync) {
    logger.info('Syncing ID:', sync.id);
    try {
      const mergedExcludeRegex = [...(config.excludeRegex || []), ...(sync.excludeRegex || [])];
      await backup({
        src: sync.src,
        dest: sync.dest,
        excludeRegex: mergedExcludeRegex,
        compare: sync.compare,
        autoCompareBySizeThreshold: config.autoCompareBySizeThreshold,
      });
      await cleanup({ src: sync.src, dest: sync.dest, excludeRegex: mergedExcludeRegex });
    } catch (e) {
      logger.error(e);
    }
  }
})();
