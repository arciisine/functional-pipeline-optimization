import {TestUtil} from '../../../core';

function Manual(names:string[]) {
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


function Functional(names:string[]) {
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

function Optimized(names:string[]) {
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

let names = TestUtil.readFile(`${__dirname}/../resources/names.txt`).replace(/"/g, '').split(',');

export default {
  tests        : {
    Manual, 
    Functional, 
    Optimized
  },
  data         : (n) => names.slice(0, n),
};