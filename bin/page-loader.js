#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import pageloader from '../src/index.js';
import { urlFile } from '../src/utils.js';

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .helpOption('-h, --help', 'display help for command')
  .argument('<url>')
  .action((url) => {
    pageloader(url, program.opts().output)
      .then(() => {
        console.log(`Page was successfully downloaded into ${path.join(program.opts().output, urlFile(url))}`);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  });

program.parse();
