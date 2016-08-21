import {doTest, readFile} from './util';

type agg = {[key:string]:number};
type acc = {all:agg, common:agg};
type sig = {text:string[], limit:number};

function findMostCommonWords({text, limit}:sig) {
  let words = text//.split(/[^A-Za-z]*/);
  let check:acc = {all:{}, common:{}};
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (word.length < 4) {
      continue;
    }
    word = word.toLowerCase();
    let count = check.all[word] = (check.all[word] || 0) + 1;
    if (check.all[word] > limit) {
      check.common[word] = count;
    }
  }
  return check.common;
}

function findMostCommonWordsFunctional({text, limit}:sig) {
  return text
    //.split(/[^A-Za-z]*/)
    .filter(word => word.length >= 4)
    .map(word => word.toLowerCase())
    .reduce((check:acc,  word) => {
      let count = check.all[word] = (check.all[word] || 0)+1;
      if (count > limit) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

function findMostCommonWordsFunctionalOptimized({text, limit}:sig) {
  "use optimize";

  return text
    //.split(/[^A-Za-z]*/)
    .filter(word => word.length >= 4)
    .map(word => word.toLowerCase())
    .reduce((check:acc, word) => {
      let count = check.all[word] = (check.all[word] || 0)+1;
      if (count > limit) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

doTest(
  {findMostCommonWords, findMostCommonWordsFunctional, findMostCommonWordsFunctionalOptimized}, 
  () => ({text:readFile('resources/war-and-peace.txt.gz').split(/[^A-Za-z]+/), limit:20}),
  100
)