import {doTest, makeRandomArray} from './util';

function even(x) { return x%2 === 0; }

export function functional(data:number[]) {
    
  let hist = data
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
    .slice(1)
    .map(x => x >= 97 ? x - 32 : x)
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
let hist = eval(`
(function __gen82093831(__gen77493833) {
    var __gen97993823 = __gen77493833.value, __gen14593817 = __gen77493833.context, __gen64393832 = __gen77493833.closed;
    var __gen20993826 = 0, __gen74493819 = __gen14593817[4].initValue, __gen72193830 = __gen97993823.length;
    __gen11993821:
        for (var __gen37593822 = 0; __gen37593822 < __gen72193830; __gen37593822 += 1) {
            var __gen17093818 = __gen97993823[__gen37593822];
            if (!(__gen17093818 >= 65 && __gen17093818 < 91 || __gen17093818 >= 97 && __gen17093818 < 123)) {
                continue __gen11993821;
            }
            if (__gen20993826 < 1) {
                __gen20993826 += 1;
                continue __gen11993821;
            } else {
                __gen20993826 += 1;
            }
            __gen17093818 = __gen17093818 >= 97 ? __gen17093818 - 32 : __gen17093818;
            __gen17093818 = String.fromCharCode(__gen17093818);
            __gen74493819[__gen17093818] = (__gen74493819[__gen17093818] || 0) + 1;
            __gen74493819 = __gen74493819;
        }
    return {
        value: __gen74493819,
        assigned: []
    };
})`)

let evens = eval(`(
  function __gen79278986(__gen83678988) {
    var __gen4278981 = __gen83678988.value, __gen2178975 = __gen83678988.context, __gen81278987 = __gen83678988.closed;
    var __gen91678977 = [], __gen39178985 = __gen4278981.length;
    __gen33778979:
        for (var __gen50678980 = 0; __gen50678980 < __gen39178985; __gen50678980 += 1) {
            var __gen49178976 = __gen4278981[__gen50678980];
            if (!(__gen49178976 % 2 === 0)) {
                continue __gen33778979;
            }
            __gen49178976 = __gen49178976 << 2;
            __gen91678977.push(__gen49178976);
        }
    return {
        value: __gen91678977,
        assigned: []
    };
}
)`);

let count = eval(`(
  function __gen24879001(__gen84379003) {
    var __gen12778995 = __gen84379003.value, __gen26578989 = __gen84379003.context, __gen53679002 = __gen84379003.closed;
    var __gen29978991 = __gen26578989[2].initValue, __gen22179000 = __gen12778995.length;
    __gen87478993:
        for (var __gen46778994 = 0; __gen46778994 < __gen22179000; __gen46778994 += 1) {
            var __gen20078990 = __gen12778995[__gen46778994];
            if (!(__gen20078990 > 100)) {
                continue __gen87478993;
            }
            __gen20078990 = __gen20078990 - 10;
            __gen29978991 = __gen29978991 + __gen20078990;
        }
    return {
        value: __gen29978991,
        assigned: []
    };
}
)`);

export function functionalCompiled(data:number[]) {
  return [
    hist({ value : data, context : [null, null, null, null, {initValue:{}}], closed : []}).value,
    count({ value : data, context :[null, null, {initValue:0}], closed : []}).value,
    evens({ value : data, context : null, closed : null}).value    
  ];
}

export function functionalOptimize(data:number[]) {
  "use optimize";
    
  let hist = data
    .filter(x => x >= 65 && x < 91 || x >= 97 && x < 123)
    .slice(1)
    .map(x => x >= 97 ? x - 32 : x)
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

doTest({functional, functionalOptimize, functionalCompiled}, () => makeRandomArray())
//doTest({sum, sumOptimize}, () => getNumberData())
//doTest({functional, functionalCompiled}, () => getNumberData())