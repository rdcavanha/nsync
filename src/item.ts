import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { CompareType, Config } from './utils.js';
import { logger } from './logger.js';

const checksum = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(file);

    stream.on('data', (buff) => {
      hash.update(buff as string, 'utf8');
    });
    stream.on('end', () => {
      const hashCheckSum = hash.digest('hex');
      resolve(hashCheckSum);
    });
    stream.on('error', (error) => {
      reject(error);
    });
  });

type CompareItemProps = Pick<Config, 'autoCompareBySizeThreshold'> & {
  compare?: CompareType;
  srcItem: string;
  destItem: string;
};

const checksumCompare = async ({ srcItem, destItem }: Pick<CompareItemProps, 'srcItem' | 'destItem'>) => {
  const [srcChecksum, destChecksum] = await Promise.all([checksum(srcItem), checksum(destItem)]);
  if (srcChecksum === destChecksum) {
    logger.info('Checksum is the same', srcChecksum, destChecksum);
    return true;
  }
  logger.info('Checksum differs', srcChecksum, destChecksum);
  return false;
};

const sizeCompare = async ({ srcItem, destItem }: Pick<CompareItemProps, 'srcItem' | 'destItem'>) => {
  const srcItemSize = fs.lstatSync(srcItem).size;
  const destItemSize = fs.lstatSync(destItem).size;
  if (srcItemSize === destItemSize) {
    logger.info('Size is the same', srcItemSize, destItemSize);
    return true;
  }
  logger.info('Size differs', srcItemSize, destItemSize);
  return false;
};

const existCompare = ({ destItem }: Pick<CompareItemProps, 'destItem'>) => {
  const exists = fs.existsSync(destItem);
  if (exists) {
    logger.info('File exists in destination');
    return true;
  }
  logger.info('File does not exist in destination');
  return false;
};

export const compareItem = async ({
  compare = 'auto',
  srcItem,
  destItem,
  autoCompareBySizeThreshold = 1000000000, // 1GB,
}: CompareItemProps): Promise<boolean> => {
  switch (compare) {
    case 'exist':
      return existCompare({ destItem });
    case 'checksum':
      return checksumCompare({ srcItem, destItem });
    case 'size':
      return sizeCompare({ srcItem, destItem });
    default: {
      const srcItemSize = fs.lstatSync(srcItem).size;
      if (srcItemSize > autoCompareBySizeThreshold) {
        logger.info('Item size is', srcItemSize, '- comparing by size');
        return sizeCompare({ srcItem, destItem });
      }
      logger.info('Item size is', srcItemSize, '- comparing by checksum');
      return checksumCompare({ srcItem, destItem });
    }
  }
};

export const copy = (src: string, dest: string) => {
  logger.copy('Copying file', src, dest);
  const dir = path.dirname(dest);
  try {
    fs.mkdirSync(dir);
  } catch (e) {}
  try {
    fs.cpSync(src, dest);
  } catch (e) {
    logger.error('File copy failed', src, dest, e);
  }
};

export const remove = (dest: string) => {
  logger.delete('Removing item', dest);
  try {
    fs.rmSync(dest, { recursive: true, force: true });
  } catch (e) {
    logger.error('Removing item failed', dest, e);
  }
};
