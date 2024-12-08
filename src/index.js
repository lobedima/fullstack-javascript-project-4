import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import debug from 'debug';
import configDebug from 'axios-debug-log';
import Listr from 'listr';
import { urlFile, urlDirectory } from './utils.js';

const log = debug('page-loader');

configDebug({
  request(debugAxios, config) {
    debugAxios(`Request with ${config.headers['content-type']})`);
  },
  response(debugAxios, response) {
    debugAxios(`Response with ${response.headers['content-type']}`, `from ${response.config.url}`);
  },
  error(debugAxios, error) {
    debugAxios('Boom', error);
  },
});

const downloadFile = (pathDirectory, src) => axios.get(path.join(src), { responseType: 'stream', validateStatus: (status) => status === 200 })
  .then((response) => fs.writeFile(path.join(pathDirectory, urlFile(src)), response.data))
  .catch((error) => console.error()(error));

const downloadFiles = (urls, pathDirectory) => {
  const tasks = urls.map((el) => {
    const task = downloadFile(pathDirectory, el.href);
    return { title: el.hostname + el.pathname, task: () => task };
  });
  const taskRun = new Listr(tasks, { concurrent: true });
  return taskRun.run();
};

const preparationHtml = (html, url) => {
  const tagsAttr = { link: 'href', script: 'src', img: 'src' };
  const tagsKey = Object.keys(tagsAttr);
  const urlsDownload = [];
  const $ = cheerio.load(html);
  tagsKey.map((tag) => {
    $(tag).each(function () {
      const urlDownload = $(this).attr(tagsAttr[tag]);
      const urlHost = new URL(url);
      const urlHostOther = new URL(urlDownload, [url]);
      if (urlHostOther.hostname === urlHost.hostname) {
        urlsDownload.push(urlHostOther);
        $(this).attr(
          tagsAttr[tag],
          path.join(urlDirectory(urlHost.href), urlFile(urlHost.origin + urlHostOther.pathname)),
        );
      }
    });
    return true;
  });
  return { html: $.html(), urls: urlsDownload };
};

const pageloader = (url, pathDownload = process.cwd()) => {
  const pathFile = path.join(pathDownload, urlFile(url));
  const pathDirectory = path.join(pathDownload, urlDirectory(url));
  return fs.access(pathDirectory)
    .catch(() => fs.mkdir(pathDirectory))
    .then(() => axios.get(url, { validateStatus: (status) => status === 200 }))
    .then((response) => {
      const { html, urls } = preparationHtml(response.data, url);
      log(`write file to ${pathFile}`);
      return fs.writeFile(pathFile, html).then(() => urls); // проброс urls дальше
    })
    .then((urls) => {
      log(`download files to ${pathDirectory}`);
      return downloadFiles(urls, pathDirectory);
    });
};
export default pageloader;
