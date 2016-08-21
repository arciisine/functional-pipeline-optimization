import {doTest} from './util';
type agg = {[key:string]:number};
type acc = {all:agg, common:agg};
type sig = {txt:string[], greaterThan:number};

function findMostCommonWords({txt, greaterThan}:sig) {
  let check:acc = {all:{}, common:{}};
  for (let i = 0; i < txt.length; i++) {
    let word = txt[i];
    if (word.length < 4) {
      continue;
    }
    word = word.toLowerCase();
    let count = check.all[word] = (check.all[word] || 0) + 1;
    if (check.all[word] > greaterThan) {
      check.common[word] = count;
    }
  }
  return check.common;
}

function findMostCommonWordsFunctional({txt, greaterThan}:sig) {
  return txt
    .filter(word => word.length >= 4)
    .map(word => word.toLowerCase())
    .reduce((check:acc,  word) => {
      let count = check.all[word] = (check.all[word] || 0)+1;
      if (count > greaterThan) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

function findMostCommonWordsFunctionalOptimized({txt, greaterThan}:sig) {
  "use optimize";

  return txt
    .filter(word => word.length >= 4)
    .map(word => word.toLowerCase())
    .reduce((check:acc, word) => {
      let count = check.all[word] = (check.all[word] || 0)+1;
      if (count > greaterThan) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

import * as fs from "fs";
let data = fs.readFileSync(`${__dirname.replace('/dist', '')}/war-and-peace.txt`, 'utf8').toString().split(/[^A-Za-z]*/);

doTest({findMostCommonWords, findMostCommonWordsFunctional, findMostCommonWordsFunctionalOptimized}, () => ({txt:data, greaterThan:20}))