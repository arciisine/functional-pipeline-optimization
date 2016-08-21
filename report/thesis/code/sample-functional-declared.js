function longerThan(x) {
  return w => w.length > x
}

function toLowerCase(x) {
  return x.toLowerCase();
}

function count(limit) {
  return (check, word) => {
    let count = check.all[word] = (check.all[word] || 0)+1;
    if (count > limit) {
      check.common[word] = count;
    }
    return check;
  }
}

function findCommonWords(text, limit) {
  return text
    .split(/[^A-Za-z]*/)
    .filter(longerThan(3))
    .map(toLowerCase)
    .reduce(count(limit), {all:{}, common:{}}).common;
}