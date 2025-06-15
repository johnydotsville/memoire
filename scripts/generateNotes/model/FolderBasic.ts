export type FolderBasic = {
  title: string;
  path?: string;
  isNote: boolean;
  subfolders: FolderBasic[];
  tags?: string[];
  id?: string;
}