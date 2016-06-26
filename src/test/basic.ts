import {doTest} from './util';
import {rewriteBody} from '../body';
import '../array/source'

export function functional(data:number[]) {    
  let hist = data.r
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number})
    .exec();
      
  let count = data.r
    .filter(x => x > 100)
    .map(x => x - 10)
    .reduce((acc, x) => acc + x, 0)
    .exec();

  let evens = data.r
    .filter(x => x % 2 === 0)
    .map(x => x << 2)
    .exec();
      
  return [hist, count, evens];
}

export function functionalRaw(data:number[]) {
    
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

  let evens = data
    .filter(x => x % 2 === 0)
    .map(x => x << 2);
      
  return [hist, count, evens];
}


export function functionalManual(data:number[]) {    
  let hist = data.r
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number})
    .execManual();
      
  let count = data.r
    .filter(x => x > 100)
    .map(x => x - 10)
    .reduce((acc, x) => acc + x, 0)
    .execManual();

  let evens = data.r
    .filter(x => x % 2 === 0)
    .map(x => x << 2)
    .execManual();
      
  return [hist, count, evens];
}

//console.log(rewriteBody(functional.toString()))

doTest({functional, functionalRaw})