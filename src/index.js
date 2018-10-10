#!/usr/bin/env node
const {URLSearchParams} = require('url');
const chalk = require('chalk');
const fetch = require('node-fetch');
const fs = require('fs');
const isTextOrBinary = require('istextorbinary');
const inquirer = require('inquirer');

inquirer
    .prompt([
      {
        type: 'password',
        name: 'siteKey',
        message: 'What is your site key?',
      },
      {
        type: 'input',
        name: 'siteName',
        message: 'What is your site name?',
      },
      {
        type: 'input',
        name: 'siteCode',
        message: 'What file would you like to upload?',
        validate: (input) => {
          const fileDoesExist = fs.existsSync(input);

          if (!fileDoesExist) {
            return `${input} does not exist.`;
          }

          const inputIsFile = fs.lstatSync(input).isFile();

          if (!inputIsFile) {
            return `${input} is not a file.`;
          }

          const fileIsText = isTextOrBinary.isTextSync(input);

          if (!fileIsText) {
            return `${input} is not code.`;
          }

          return true;
        },
      },
      {
        type: 'confirm',
        name: 'siteOverwrite',
        message: 'Are you sure that you want to overwrite your previous site?',
      },
    ])
    .then((answers) => {
      fetch('https://api.1mb.site/', {
        method: 'POST',
        body: new URLSearchParams({
          action: 'edit',
          site: answers.siteName,
          key: answers.siteKey,
          code: fs.readFileSync(answers.siteCode),
        }),
      })
          .then((response) => response.json())
          .then((response) => {
            switch (response.error) {
              default:
                console.log(
                    `${chalk.red('-')} ${chalk.bold(
                        'Your site could not be deployed.'
                    )}`
                );
                process.exit(1);
                break;
              case 'INVALID_KEY':
                console.log(
                    `${chalk.red('-')} ${chalk.bold(
                        'Your site could not be deployed because your site key was invalid.'
                    )}`
                );
                process.exit(1);
                break;
              case 'NONEXISTENT_SITE':
                console.log(
                    `${chalk.red('-')} ${chalk.bold(
                        'Your site could not be deployed because the target does not exist.'
                    )}`
                );
                break;
              case false:
                console.log(
                    `${chalk.green('+')} ${chalk.bold(
                        'Your site was succesfully deployed. Check it out at'
                    )} ${chalk.blue(`https://${answers.siteName}.1mb.site`)}${chalk.bold('.')}`
                );
            }
          });
    });
