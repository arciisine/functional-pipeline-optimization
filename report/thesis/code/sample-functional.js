function findCommonWords(text, limit) {
  return text
    .split(/[^A-Za-z]*/)
    .filter(word => word.length >= 4)
    .map(word => word.toLowerCase())
    .reduce((check,  word) => {
      let count = check.all[word] = (check.all[word] || 0)+1;
      if (count > limit) {
        check.common[word] = count;
      }
      return check;
    }, {all:{}, common:{}}).common;
}