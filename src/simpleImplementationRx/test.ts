import {ArraySource} from './index';
import {doTest} from '../lib/test';

let wrappers:{[key:string]:ArraySource<any>} = {}

function wrapArray<T>(data:T[], key):ArraySource<T> {
  if (!wrappers[key]) {
    wrappers[key] = new ArraySource(data)
  }
  return wrappers[key];
}
/*
function compiled(data:number[]) {
  return wrapArray(data, 'a')
      .filter(x => x % 2 === 0)
      .map(x => x * 2)
      .map((x,i) => x.toString() + i)
      .map(x => parseInt(x))
      .reduce((acc, x) => acc + x, 0)
      .exec();
}

function raw(data:number[]) {
  return  data.filter(x => x % 2 === 0)
      .map(x => x * 2)
      .map((x,i) => x.toString() + i)
      .map(x => parseInt(x))
      .reduce((acc, x) => acc + x, 0)
}

doTest(compiled, raw);
*/

function functional(data:number[]) {    
  let hist = wrapArray(data, 'b')
    .filter(x => x > 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number})
    .exec();
      
  let count = wrapArray(data, 'c')
    .filter(x => x > 100)
    .map(function(x) {
      return x - 10
    })
    .reduce((acc, x) => acc + x, 0)
    .exec();

  let evens = wrapArray(data, 'd')
    .filter(x => x % 2 === 0)
    .map(x => x << 2)
    .exec();
      
  return [hist, count, evens];
}

function functionalRaw(data:number[]) {
    
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

  let evens = data
    .filter(x => x % 2 === 0)
    .map(x => x << 2);
      
  return [hist, count, evens];
}

doTest(functional, functionalRaw)