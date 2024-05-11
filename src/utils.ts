import fs from 'fs';
import YAML from 'yaml';

export type CompareType = 'size' | 'checksum' | 'auto' | 'exist';

export type Config = {
  autoCompareBySizeThreshold?: number;
  excludeRegex?: string[];
  sync: { id: string; compare?: CompareType; src: string; dest: string; excludeRegex?: string[] }[];
};

export const config: Config = YAML.parse(fs.readFileSync('./config.yml', 'utf-8'));
