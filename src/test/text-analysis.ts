import {doTest, readFile} from './util';

type agg = {[key:string]:number};
type acc = {all:agg, common:agg};
type sig = {txt:string, greaterThan:number};

function findMostCommonWords({txt, greaterThan}:sig) {
  let words = txt.split(/[^A-Za-z]*/);
  let check:acc = {all:{}, common:{}};
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
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
    .split(/[^A-Za-z]*/)
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
    .split(/[^A-Za-z]*/)
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

doTest(
  {findMostCommonWords, findMostCommonWordsFunctional, findMostCommonWordsFunctionalOptimized}, 
  () => ({txt:readFile('resources/war-and-peace.txt.gz'), greaterThan:20}),
)