import type { Folder } from '../model/Folder';


export function flattenFoldersTree(root: Folder): Folder[] {
  const directories: Folder[] = [];
  directories.push(root);
  root.subfolders.forEach(sub => directories.push(...flattenFoldersTree(sub)));
  return directories;
}