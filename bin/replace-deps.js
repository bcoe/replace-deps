#!/usr/bin/env node

var argv = require('yargs')
  .option('find', {
    alias: 'f',
    description: 'string to find in module being required',
    required: true
  })
  .option('replace', {
    alias: 'r',
    description: 'replacement for matched strings',
    required: true
  })
  .option('path', {
    alias: 'p',
    description: 'what path should we perform replacements within',
    default: './'
  })
  .help('h')
  .alias('h', 'help')
  .version(require('../package.json').version)
  .alias('v', 'version')
  .argv
var chalk = require('chalk')
var rd = require('../index.js')

rd({
  path: argv.path,
  replace: function (requireStr) {
    if (requireStr.match('pre-')) return "'" + requireStr.replace('pre-', '@pre/') + "'"
    return "'" + requireStr + "'"
  }
}).write(function (e) {
  console.log('replaced ' + chalk.red(argv.find) + ' with ' + chalk.green(argv.replace) + ' in', argv.path)
})
