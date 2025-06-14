import type { Folder } from './model/Folder';
import path from 'path';
import fs from 'fs/promises';


export async function buildFoldersTree(rootDir: string): Promise<Folder> {
  const notesBase = path.basename(rootDir);

  const rootCategory: Folder = {
    name: 'root',
    fullpath: rootDir,
    shortpath: notesBase,
    meta: [],
    isNote: false,
    subfolders: []
  };

  async function scan(folder: Folder) {
    const folders = await fs.readdir(folder.fullpath);
    for (const curFolder of folders) {
      const fullpath = path.join(folder.fullpath, curFolder);
      const stat = await fs.stat(fullpath);
      if (stat.isDirectory()) {
        const childFolder: Folder = {
          name: curFolder,
          fullpath,
          shortpath: path.join(folder.shortpath, curFolder),
          meta: [],
          isNote: false,
          subfolders: []
        };
        folder.subfolders.push(childFolder);
        if (curFolder.startsWith('note-')) {
          childFolder.isNote = true;
        } else {
          childFolder.isNote = false; 
          await scan(childFolder);
        }
      }
    }
  }
  
  await scan(rootCategory);
  return rootCategory;
}