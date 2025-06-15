import type { FolderBasic } from "@/scripts/generateNotes/model/FolderBasic";

export function flattenTree(root: FolderBasic): FolderBasic[] {
  const directories: FolderBasic[] = [];
  directories.push(root);
  root.subfolders.forEach(sub => directories.push(...flattenTree(sub)));
  return directories;
}