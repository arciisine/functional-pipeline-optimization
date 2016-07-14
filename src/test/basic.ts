import {doTest} from './util';
import '../impl/array/bootstrap';

export function functional(data:number[]) {    
  let hist = data
    .filter(x =>  x >= 65 && x < 91 || x >= 97 && x < 123) 
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number})
      
  let count = data
    .filter(x => x > 100)
    .map(x => x - 10)
    .reduce((acc, x) => acc + x, 0);

  let evens = data
    .filter(x => x % 2 === 0)
    .map(x => x << 2);
      
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
      
  let evens = data
    .filter(x => x % 2 === 0)
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

export function obj(data:number[]) {
  let test = [{age:10, name:'Bob'}]
    .filter(({age,name}) => age > 10)
    .map(({name}) => name.toUpperCase())
  console.log(test);    
}

doTest({functionalRaw})