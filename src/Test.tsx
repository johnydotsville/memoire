import { useState, useEffect } from "react"
import tree from '../notesHtml/folderTree.json';


export const Test = () => {
  // const [tree, setTree] = useState();

  // useEffect(() => {
  //   getTreeFromFile();
  //   async function getTreeFromFile() {
  //     const tree = await fetch('');
  //     const json = await tree.json();
  //     setTree(json);
  //   }
  // }, []);


  return <div>{ tree.shortpath }</div>
}