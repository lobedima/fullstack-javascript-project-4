import path from 'path';

const replaceSymbol = (str) => str.replace(/[^a-z0-9]/ig, '-');

export const urlFile = (url) => {
  const { hostname, pathname } = new URL(url);
  const { ext, dir, name } = path.parse(pathname);
  const str = replaceSymbol(path.join(hostname, dir === '/' ? '' : dir, name));
  return (ext) ? `${str}${ext}` : `${str}.html`;
};

export const urlDirectory = (url) => {
  const { hostname, pathname } = new URL(url);
  const str = pathname === '/' ? hostname : path.join(hostname, pathname);
  return `${replaceSymbol(str)}_files`;
};
