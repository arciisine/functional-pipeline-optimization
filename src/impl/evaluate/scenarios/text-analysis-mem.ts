import {TestUtil} from '../../../core';

type agg = {[key:string]:number};
type acc = {all:agg, common:agg};
type sig = {text:string, limit:number};

function Manual({text, limit}:sig) {
  let words = text.toLowerCase().split(/[^A-Za-z]+/)
  let check:acc = {all:{}, common:{}};
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (word.length < limit) {
      continue;
    }
    let count = check.common[word] || (check.all[word] = (check.all[word] || 0)+1);
    if (check.all[word] > limit) {
      check.common[word] = count;
    }
  }
  return check.common;
}

function Functional({text, limit}:sig) {
  return text
    .toLowerCase().split(/[^A-Za-z]+/)
    .filter(word => word.length >= limit)
    .reduce((check:acc,  word) => {
      let count = check.common[word] || (check.all[word] = (check.all[word] || 0)+1);
      if (count > limit) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

function Optimized({text, limit}:sig) {
  "use optimize";

  return text
    .toLowerCase().split(/[^A-Za-z]+/)
    .filter(word => word.length >= limit)
    .reduce((check:acc, word) => {
      let count = check.common[word] || (check.all[word] = (check.all[word] || 0)+1);
      if (count > limit) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}

let text = TestUtil.readFile(`${__dirname}/../resources/war-and-peace.txt.gz`);

export default {
  tests        : {Manual, Functional, Optimized},
  data         : (n) => ({text: text.substring(0, n), limit: 4})
}