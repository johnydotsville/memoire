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
  noteTemplate: path.join(PROJECT_ROOT, 'noteTemplate.ejs')
};


type Folder = {
  name: string;
  fullpath: string;
  shortpath: string;
  isNote: boolean;
  subfolders: Folder[];
  meta?: (Meta | null)[];  // Мета каждой папки - это массив мет. В [0] - собственная мета, а дальше - меты родителей.
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
  // Вернуть можно uid файла и положить его в дерево
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



// async function makeTask(folder: Folder): Promise<Task> {
//   const description = await mdToString(path.join(folder.fullpath, 'description.md'));
//   const template = await sourceCodeToString(path.join(folder.fullpath, 'template.ts'));
//   const solution = await sourceCodeToString(path.join(folder.fullpath, 'solution.ts'));
//   const categories = getCategoriesFromTaskDir(folder.fullpath);
//   const title = folder.meta?.[0]?.title ?? '';
//   const tagsAsSet = folder.meta?.reduce((tagsSet, meta) => {
//     meta?.tags?.forEach(tag => tagsSet.add(tag));
//     return tagsSet;
//   }, new Set<string>());

//   console.log(folder.shortpath)
//   // console.log(folder.path);
//   // console.log(folder.meta);
//   // console.log('------------------------------------');
  
//   return {
//     id: idFromPath(folder.fullpath),
//     name: folder.name,
//     path: folder.shortpath,
//     title,
//     description,
//     template,
//     solution,
//     categories,
//     tags: tagsAsSet ? [...tagsAsSet] : []
//   }
// }


// function getCategoriesFromTaskDir(taskDir: string) {
//   const base = path.dirname(path.relative(PATHS.tasks, taskDir));
//   const normalized = path.normalize(base);
//   return normalized.split(path.sep);
// }


// async function mdToString(mdPath: string) {
//   try {
//     const description = await fs.readFile(mdPath, 'utf8');
//     return description;
//   } catch (error) {
//     if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
//       console.warn(`⚠️ Не удалось спарсить markdown из файла '${mdPath}': ` + error.message);
//     }
//   }
//   return '';
// }


// async function sourceCodeToString(scPath: string) {
//   try {
//     const tstext = await fs.readFile(scPath, 'utf-8');
//     return tstext.replace(/\$\{/g, '\\${');
//   } catch (error) {
//     if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
//       console.warn(`⚠️ Не удалось спарсить source code из файла '${scPath}': ` + error.message);
//     }
//   }
//   return '';
// }


// function catTreeToString(cat: Folder, indentLevel = 0, indentSpace = 2) {
//   const indent = (num: number) => ' '.repeat(num);
//   const curly = indentLevel * indentSpace * 2;
//   const fields = curly + indentSpace;
//   const sq = curly + indentSpace;
//   const curlyin = indent(curly);
//   const fieldsin = indent(fields);
//   const sqin = indent(sq);
  
//   const formattedCategories = (cat.subfolders.filter(sub => !sub.isTask)).length > 0
//     ? `[
// ${cat.subfolders.filter(sub => !sub.isTask).map(c => catTreeToString(c, indentLevel + 1)).join(',\n')}
// ${sqin}]`
//     : '[]';

//   return `${curlyin}{\n${fieldsin}name: '${cat.name}',\n${fieldsin}title: '${cat.meta?.[0]?.title ?? ""}',\n${fieldsin}subcategories: ${formattedCategories}\n${curlyin}}`
// }


// async function writeTasks(tasks: Task[], rootcat: Folder) {
//   let tsContent = `// Auto-generated file (${new Date().toISOString()})
// import type { Task, Category } from "@/src/types/model";

// export const rootcat: Category = 
// ${catTreeToString(rootcat)}

// export const tasks: Task[] = [
// ${tasks.map(task => `  {
//     id: ${JSON.stringify(task.id)},
//     name: ${JSON.stringify(task.name)},
//     path: ${JSON.stringify(task.path)},
//     title: ${JSON.stringify(task.title)},
//     description: ${JSON.stringify(task.description)},
//     template: \`${task.template.replace(/`/g, '\\`')}\`,
//     solution: \`${task.solution.replace(/`/g, '\\`')}\`,
//     categories: [${task.categories.map(c => `'${c}'`).join(', ')}],
//     tags: [${task.tags.map(c => `'${c}'`).join(', ')}]
//   }`).join(',\n')}
// ];

// export default tasks;
// `;

//   await fs.writeFile(PATHS.output, tsContent);
// }


function idFromPath(path: string) {
  return createHash('sha256').update(path).digest('hex').slice(0, 16);
}


async function genNotes() {
  const foldersTree = await buildFoldersTree(PATHS.notes);
  await fillFoldersMeta(foldersTree);
  const flatFoldersTree = flattenFoldersTree(foldersTree);

  const noteFolders = flatFoldersTree.filter(folder => folder.isNote);
  // const notes = await Promise.all(noteFolders.map(folder => makeNote(folder)));
  await Promise.all(noteFolders.map(folder => makeNote(folder)));
  
  // await writeTasks(tasks, foldersTree);
}

genNotes();