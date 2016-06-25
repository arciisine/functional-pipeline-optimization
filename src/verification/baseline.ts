import {doTest} from '../test';

function functional(data:number[]) {
    
  let hist = data
    .filter(x => x > 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number});
      
  let count = data
    .filter(x => x > 100)
    .map(function(x) {
      return x - 10
    })
    .reduce((acc, x) => acc + x, 0);

  let evens = data.filter(x => x % 2 === 0).map(x => x << 2);
      
  return [hist, count, evens];
}

function procedural(data:number[]) {
  let hist:{[key:string]:number} = {}
  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x >= 65 && x < 91 || x >= 97 && x < 123) {
      if (x > 91) {
        x = x - 32
      }
      let ch = String.fromCharCode(x)
      hist[ch] = (hist[ch] || 0) + 1;
    }
  } 

  let count = 0
  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x > 100) {
      x -= 10
      count += x
    }
  }

  let evens = []
  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x % 2 === 0) {
      evens.push(x << 2);
    }
  }

  return [hist, count, evens]
}


doTest(functional, procedural);