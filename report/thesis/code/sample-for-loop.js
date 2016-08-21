function findCommonWords(text, limit) {
  let words = text.split(/[^A-Za-z]*/);
  let check = {all:{}, common:{}};
  for (let word of words) {
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