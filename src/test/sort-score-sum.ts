import {doTest, readFile } from './util';

function sortScoreSumManual(names:string[]) {
  names = names.sort();
  let total = 0;

  for (let i = 0; i < names.length; i++) {
    let x = names[i];
    let score = 0;
    for (let ch of x.split('')) {
      score += ch.charCodeAt(0) - 64;
    }
    total += score * (i+1);
  }
  return total;
}


function sortScoreSum(names:string[]) {
  return names
    .sort()
    .map((x,i) => {
      return (i+1) * x
        .split('')
        .map(x => x.charCodeAt(0) - 64)
        .reduce((acc, v) => acc+v, 0)
    })
    .reduce((acc,v) => acc+v, 0);
}

function sortScoreSumOpt(names:string[]) {
  'use optimize';

  return names
    .sort()
    .map((x,i) => 
      (i+1) * x
        .split('')
        .map((x) => x.charCodeAt(0) - 64)
        .reduce((acc, v) => acc+v, 0 )
    )
    .reduce((acc,v) => acc+v, 0);
}
/*
function sortScoreSumOptOuter(names:string[]) {
  'use optimize';

  return names
    .sort()
    .map((x,i) => {
      'disable optimize';

      return (i+1) * x
        .split('')
        .map((x) => x.charCodeAt(0) - 64)
        .reduce((acc, v) => acc+v, 0 )
    })
    .reduce((acc,v) => acc+v, 0);
}

function sortScoreSumOptInner(names:string[]) {

  return names
    .sort()
    .map((x,i) => {
      'use optimize';

      return (i+1) * x
        .split('')
        .map((x) => x.charCodeAt(0) - 64)
        .reduce((acc, v) => acc+v, 0 )
    })
    .reduce((acc,v) => acc+v, 0);
}
*/

let names = readFile("resources/names.txt").replace(/"/g, '').split(',');
doTest(
  {
    sortScoreSum, 
    sortScoreSumOpt, 
    sortScoreSumManual, 
//    sortScoreSumOptOuter,
//    sortScoreSumOptInner
  }, 
  () => names.slice(0), 
  10
)