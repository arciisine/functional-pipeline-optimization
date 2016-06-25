import {doTest} from './util';

export function functional(data:number[]) {
    
  let hist = data
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
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

export function procedural(data:number[], hist = {}, count = 0, evens = []) {
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

  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x > 100) {
      x -= 10
      count += x
    }
  }

  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x % 2 === 0) {
      evens.push(x << 2);
    }
  }

  return [hist, count, evens]
}


export function proceduralFunctioned(data:number[]) {
  let hist = (function(hist) { 
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
    return hist;
  })({}); 

  let count = (function(count) {
    for (let i = 0; i < data.length; i++) {
      let x = data[i]
      if (x > 100) {
        x -= 10
        count += x
      }
    }
    return count;
  })(0);

  let evens = (function(evens) {
    for (let i = 0; i < data.length; i++) {
      let x = data[i]
      if (x % 2 === 0) {
        evens.push(x << 2);
      }
    }
    return evens;
  })([]);

  return [hist, count, evens]
}


//doTest({functional, procedural});