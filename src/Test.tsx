import { useState, useEffect } from "react"
import tree from '@src/data/folderTree.json';
import { flattenTree } from "./utils/flattenTree";


export const Test = () => {
  const [notes, setNotes] = useState();

  useEffect(() => {
    const flatTree = flattenTree(tree) ;
    const notesOnly = flatTree.filter(folder => folder.isNote);
    setNotes(notesOnly);
  }, []);

  if (!notes) return <div>Грузим...</div>

  return (
    <div>{notes.map(note => 
      <div key={note.id}>
        <a href={`/static/documents/${note.id}.html`} target='_blank'>{note.title}</a>
      </div>)}
    </div>
  )
}