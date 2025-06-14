import type { Meta } from '@src/types/model/Meta';
import type { Folder } from './model/Folder';
import path from 'path';
import fs from 'fs/promises';


export async function attachMeta(folder: Folder, parentMetas: (Meta | null)[] = []): Promise<void> {
  const meta = await getMeta(path.join(folder.fullpath, 'meta.json'));
  const myMeta: (Meta | null)[] = [meta, ...parentMetas];
  folder.meta = myMeta;
  if (!folder.isNote) {
    for (const subfolder of folder.subfolders) {
      await attachMeta(subfolder, myMeta)
    }
  }
}


async function getMeta(metaPath: string): Promise<Meta | null> {
  try {
    const metaRaw = await fs.readFile(metaPath, 'utf8');
    const json = JSON.parse(metaRaw);
    return json;
  } catch {
    console.warn(`⚠️ Не найден meta-файл для ${metaPath}.`);
    return null;
  }
}