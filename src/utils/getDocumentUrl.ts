export const getDocumentUrl = (filename) => {
  const base = import.meta.env.BASE_URL;
  return `${base}static/documents/${filename}`;
};