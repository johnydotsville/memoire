import type { Meta } from '@src/types/model/Meta';


export type Folder = {
  name: string;
  fullpath: string;
  shortpath: string;
  isNote: boolean;
  subfolders: Folder[];
  meta: (Meta | null)[];  // Мета каждой папки - это массив мет. В [0] - собственная мета, а дальше - меты родителей.
  id?: string;
}