import {doTest} from '../test';
import '../basic/source'

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
  let hist = data.r()
    .filter(x => x > 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number})
    .exec();
      
  let count = data.r()
    .filter(x => x > 100)
    .map(x => x - 10)
    .reduce((acc, x) => acc + x, 0)
    .exec();

  let evens = data.r()
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


function functionalManual(data:number[]) {    
  let hist = data.r()
    .filter(x => x > 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number})
    .execManual();
      
  let count = data.r()
    .filter(x => x > 100)
    .map(x => x - 10)
    .reduce((acc, x) => acc + x, 0)
    .execManual();

  let evens = data.r()
    .filter(x => x % 2 === 0)
    .map(x => x << 2)
    .execManual();
      
  return [hist, count, evens];
}

doTest(functionalManual, functional)