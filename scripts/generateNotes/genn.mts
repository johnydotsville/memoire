import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Meta } from '@src/types/model/Meta';
import { createHash } from 'crypto';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import ejs from 'ejs';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ROOT = path.join(__dirname, '../..');
const PATHS = {
  notes: path.join(PROJECT_ROOT, 'notes'),
  output: path.join(PROJECT_ROOT, 'notesHtml'),
  noteTemplate: path.join(PROJECT_ROOT, 'noteTemplate.ejs'),
};


type Folder = {
  name: string;
  fullpath: string;
  shortpath: string;
  isNote: boolean;
  subfolders: Folder[];
  meta: (Meta | null)[];  // Мета каждой папки - это массив мет. В [0] - собственная мета, а дальше - меты родителей.
  id?: string;
}


const md = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return hljs.highlightAuto(str).value;
  }
});


async function buildFoldersTree(rootDir: string): Promise<Folder> {
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


async function fillFoldersMeta(folder: Folder, parentMetas: (Meta | null)[] = []): Promise<void> {
  const meta = await getMeta(path.join(folder.fullpath, 'meta.json'));
  const myMeta: (Meta | null)[] = [meta, ...parentMetas];
  folder.meta = myMeta;
  if (!folder.isNote) {
    for (const subfolder of folder.subfolders) {
      await fillFoldersMeta(subfolder, myMeta)
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


function flattenFoldersTree(root: Folder): Folder[] {
  const directories: Folder[] = [];
  directories.push(root);
  root.subfolders.forEach(sub => directories.push(...flattenFoldersTree(sub)));
  return directories;
}


async function makeNote(folder: Folder): Promise<void> {
  const files = await fs.readdir(folder.fullpath);
  let notepath;
  for (const file of files) {
    const fullpath = path.join(folder.fullpath, file);
    const stat = await fs.stat(fullpath);
    if (stat.isDirectory() || !isMarkdownFile(file)) continue;
    notepath = fullpath;
    break;
  }
  if (!notepath) {
    console.warn(`⚠️ Не найден md-файл с заметкой в note-директории ${folder.fullpath}`);
    return;
  }
  const markdownContent = await fs.readFile(notepath, 'utf-8');
  const noteTemplate = await fs.readFile(PATHS.noteTemplate, 'utf-8');
  const htmlContent = md.render(markdownContent);
  const noteId = idFromPath(notepath);
  folder.id = noteId;
  const finalHtml = ejs.render(noteTemplate, {
    title: folder.meta?.[0]?.title || 'Заметка',
    content: htmlContent,
    stylesheet: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css"
  });
  await fs.writeFile(path.join(PATHS.output, noteId + '.html'), finalHtml);
}


function isMarkdownFile(filename) {
  return path.extname(filename).toLowerCase() === '.md';
}



function idFromPath(path: string) {
  return createHash('sha256').update(path).digest('hex').slice(0, 16);
}


function minimizeFolderInfo(root: Folder) {
  const scan = function(folder: Folder) {
    if (folder.isNote) {
      let title = folder.meta[0] ? folder.meta[0].title : folder.name;
      let tags = folder.meta.reduce((allTags: string[], meta) => {
        if (meta) {
          return [...allTags, ...meta.tags];
        } else {
          return [];
        }
      }, []);
      folder.meta = [{
        title,
        tags
      }]
    } else {
      folder.meta = [folder.meta[0]];
      folder.subfolders.forEach(subfolder => minimizeFolderInfo(subfolder));
    }
  }
  scan(root);
  
  return root;
}


async function genNotes() {
  const foldersTree = await buildFoldersTree(PATHS.notes);
  await fillFoldersMeta(foldersTree);
  const flatFoldersTree = flattenFoldersTree(foldersTree);

  const noteFolders = flatFoldersTree.filter(folder => folder.isNote);
  await Promise.all(noteFolders.map(folder => makeNote(folder)));
  const miniFolder = minimizeFolderInfo(foldersTree);

  await fs.writeFile(path.join(PATHS.output, 'folderTree.json'), JSON.stringify(miniFolder, null, 2));
}

genNotes();