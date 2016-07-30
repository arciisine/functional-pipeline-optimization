import {doTest, getNumberData} from './util';
import '../impl/array/bootstrap';

function even(x) { return x%2 === 0; }

export function functional(data:number[]) {
    
  let hist = data
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number});
      
  let evens = data
    .filter(even)
    .map(x => x << 2);

  let count = data
    .filter(x => x > 100)
    .map(function z(x) {
      return x - 10
    })
    .reduce((acc, x) => acc + x, 0);

  return [hist, count, evens];
}

export function functionalOptimize(data:number[]) {
  "use optimize";
    
  let hist = data
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number});
      
  let evens = data
    .filter(even)
    .map(x => x << 2);

  let count = data
    .filter(x => x > 100)
    .map(function z(x) {
      return x - 10
    })
    .reduce((acc, x) => acc + x, 0);

  return [hist, count, evens];
}

export function sum(data:number[]) {
    
  let count = 0;

  data
    .filter(x => x > 10)
    .map(x => x * 2)
    .forEach(x => count += x)
    
  return [count]
}

export function sumOptimize(data:number[]) {
  'use optimize';

  let count = 0;

  data
    .filter(x => x > 10)
    .map(x => x * 2)
    .forEach(x => count += x)
    
  return [count]
}

let names = null;

export function obj(data:number[]) {
  'use optimize';
  if (names === null) {
    names = data.reduce((acc, x) => (acc[x] = {age:x, name:`Bob${x}`}) && acc, {})
  }
  let test = data
    .map(x => names[x])
    .filter(x => x.age > this.max_age)
    .map(x => x.name)
  return test
}

doTest({functional, functionalOptimize}, getNumberData())
//doTest({sum, sumOptimize}, getNumberData())