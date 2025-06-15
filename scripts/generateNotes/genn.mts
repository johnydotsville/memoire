import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import ejs from 'ejs';
import type { Folder } from './model/Folder'
import { isMarkdownFile } from './utils/isMarkdownFile';
import { idFromPath } from './utils/idFromPath';
import { flattenFoldersTree } from './utils/flattenFoldersTree';
import { attachMeta } from './attachMeta';
import { buildFoldersTree } from './buildFordersTree';
import { convertToFolderBasic } from './covertToFolderBasic';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ROOT = path.join(__dirname, '../..');
const PATHS = {
  projectRoot: PROJECT_ROOT,
  notes: path.join(PROJECT_ROOT, 'notes'),
  outputTree: path.join(PROJECT_ROOT, 'src/data'),
  outputHtmlFiles: path.join(PROJECT_ROOT, 'public/static/documents'),
  noteTemplate: path.join(PROJECT_ROOT, 'noteTemplate.ejs'),
};


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
  await fs.writeFile(path.join(PATHS.outputHtmlFiles, noteId + '.html'), finalHtml);
}


async function genNotes() {
  const rawFoldersTree = await buildFoldersTree(PATHS.notes);
  await attachMeta(rawFoldersTree);
  const flatFoldersTree = flattenFoldersTree(rawFoldersTree);

  const noteFolders = flatFoldersTree.filter(folder => folder.isNote);
  await Promise.all(noteFolders.map(folder => makeNote(folder)));
  const basicFoldersTree = convertToFolderBasic(rawFoldersTree);

  await fs.writeFile(path.join(PATHS.outputTree, 'folderTree.json'), JSON.stringify(basicFoldersTree, null, 2));
}

genNotes();