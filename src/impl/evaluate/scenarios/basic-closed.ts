const even = x => x%2 === 0
const isLetter = x => x >= 65 && x < 91 || x >= 97 && x < 123;
const toUpperCase = x => x >= 97 ? x - 32 : x;
const fromAscii = x => String.fromCharCode(x);
const double = x => x << 2;
const add = (ttl, v) => ttl + v;
function histogram(map:{[key:string]:number}, char:string) {
  map[char] = (map[char] || 0) + 1;
  return map;
}
function subtracter(x) {
  return y => y - x;
}
function biggerThan(x) {
  return y => y > x;
}

export function functional(data:number[]) {
    
  let hist = data
    .filter(isLetter)
    .map(toUpperCase)
    .map(fromAscii)
    .reduce(histogram, {} as {[key:string]:number});

  let evens = data
    .filter(even)
    .map(double);

  let count = data
    .filter(biggerThan(100))
    .map(subtracter(10))
    .reduce(add, 0);
  
  return [hist, count, evens];
}

export function functionalOptimize(data:number[]) {
  "use optimize";
    
 let hist = data
    .filter(isLetter)
    .map(toUpperCase)
    .map(fromAscii)
    .reduce(histogram, {} as {[key:string]:number});

  let evens = data
    .filter(even)
    .map(double);

  let count = data
    .filter(biggerThan(100))
    .map(subtracter(10))
    .reduce(add, 0);
  
  return [hist, count, evens];
}

//doTest({functional, functionalOptimize}, () => makeRandomArray(1), 1000000)
//doTest({sum, sumOptimize}, () => getNumberData())
//doTest({functional, functionalCompiled}, () => getNumberData())