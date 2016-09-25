let toLowerCase = x => x.toLowerCase();

let longerThan = (x) => 
  w => w.length > x;

let count = (limit) => 
  (check, word) => {
    let count = check.all[word] = (check.all[word] || 0)+1;
    if (count > limit) {
      check.common[word] = count;
    }
    return check;
  }

function findCommonWords(text, limit) {
  return text
    .split(/[^A-Za-z]*/)
    .filter(longerThan(3))
    .map(toLowerCase)
    .reduce(count(limit), {all:{}, common:{}}).common;
}