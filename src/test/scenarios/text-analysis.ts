import {TestUtil} from '../util';

type agg = {[key:string]:number};
type acc = {all:agg, common:agg};
type sig = {text:string[], limit:number};

function findMostCommonWords({text, limit}:sig) {
  let words = text
  let check:acc = {all:{}, common:{}};
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (word.length < 4) {
      continue;
    }
    let count = check.all[word] = (check.all[word] || 0) + 1;
    if (check.all[word] > limit) {
      check.common[word] = count;
    }
  }
  return check.common;
}

function findMostCommonWordsFunctional({text, limit}:sig) {
  return text
    .filter(word => word.length >= limit)
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
    .filter(word => word.length >= limit)
    .reduce((check:acc, word) => {
      let count = check.all[word] = (check.all[word] || 0)+1;
      if (count > limit) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

let text = TestUtil.readFile('resources/war-and-peace.txt.gz').toLowerCase().split(/[^A-Za-z]+/);

export default {
  tests        : {findMostCommonWords, findMostCommonWordsFunctional, findMostCommonWordsFunctionalOptimized},
  maxInputSize : text.length, 
  data         : (n) => ({text: text.slice(0, n), limit: 40})
}