import type { Folder } from "./model/Folder";
import type { FolderBasic } from "./model/FolderBasic";


export function convertToFolderBasic(rootFolder: Folder): FolderBasic {
  function transform(folder: Folder, parentTags: string[] = []): FolderBasic {
    const currentMeta = folder.meta?.[0];
    
    // Накопленные теги (родители + текущие) с удалением дублей
    const accumulatedTags = [
      ...parentTags,
      ...(currentMeta?.tags || []),
    ].filter((tag, index, arr) => arr.indexOf(tag) === index);

    const transformedSubfolders = folder.subfolders.map(subfolder => 
      transform(subfolder, folder.isNote ? [] : accumulatedTags)
    );

    const basicFolder: FolderBasic = {
      title: currentMeta?.title || folder.name,
      ...(folder.id && { id: folder.id }),
      isNote: folder.isNote,
      path: folder.shortpath,
      tags: accumulatedTags,
      subfolders: transformedSubfolders,
    };

    return basicFolder;
  }

  return transform(rootFolder);
}