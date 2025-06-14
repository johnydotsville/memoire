import path from 'path';


export function isMarkdownFile(filename) {
  return path.extname(filename).toLowerCase() === '.md';
}