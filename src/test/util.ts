import {Helper} from '../impl/array/bootstrap';
import * as fs from "fs";
import * as zlib from "zlib";

const ITERATIONS = 100000;
const DATA_SIZE = 10;

let fileCache = {};

export function makeRandomArray(size:number = DATA_SIZE):number[] {
  let data:number[] = Array(size);
  for (let i = 0; i < data.length; i++) {
    data[i] = parseInt(''+(Math.random() * 255));
  }
  return data
}

export function readFile(name:string, cache:boolean = true):string {
  if (fileCache[name] && cache) {
    return fileCache[name];
  }
  let base = __dirname;
  if (!name.endsWith('.js')) {
    base = base.replace('/dist', '')
  }
  let src = fs.readFileSync(`${base}/${name}`);
  if (name.endsWith('.gz')) {
    src =  zlib.deflateSync(src);
  }
  let text = src.toString();
  if (cache) {
    fileCache[name] = text;
  }
  return text;
}

export function areEqual(a, b):boolean {
  if (typeof a !== typeof b) {
    return false;
  }
  switch (typeof a) {
    case 'boolean':
    case 'string':
    case 'number':
      return a === b
    case 'function':
      return areEqual(a.toString(), b.toString());
    default:
      if (Array.isArray(a)) {
        if (!Array.isArray(b) || !(a.length === b.length)) {
          return false;
        }
        let res = true;
        for (let i = 0; res && i < a.length; i++) {
          res = res && areEqual(a[i], b[i]);
        }
        return res;
      } else { //Object
        let keys = Object.keys(a);
        let bkeys = Object.keys(b);
        if (!areEqual(keys, bkeys)) {
          return false;
        }
        let res = true;
        for (let i = 0; i < keys.length; i++) {
          res = res && areEqual(a[keys[i]], b[keys[i]])
        }
        return res;
      }       
  }
}


function log(title, o){
  console.log(title)
  console.log('='.repeat(20)) 
  console.log(JSON.stringify(o, null, 2))
  console.log()
}

interface FunctionMap<T> {
   [key:string]:(nums:T)=>any
}

function test<T>(tests:FunctionMap<T>, data:()=>T, iterations:number) {
  let counts = {};
  let keys = Object.keys(tests);
  keys.forEach(t => {
    counts[t] = []
    tests[t](data())
  });

  let time = 0;

  let d = data() 
  
  console.log("Running ", iterations)

  for (let i = 0; i < iterations; i++) {
    let k = keys[Math.max(0, Math.min(keys.length-1, parseInt(Math.random()*keys.length as any)))];
    let start = process.hrtime()
    try {
      tests[k](d)
      let [sec, nano] = process.hrtime(start)
      counts[k].push(sec/1000 + nano/1e9);
    } catch(e) {
      console.log(e ,k);
    }
  }
  let out:{[key:string]:{min:number,max:number,n:number,avg:number}} = {};
  keys.forEach(k => {
    out[k] = {
      min : counts[k].reduce((min, v) => v < min ? v : min, Number.MAX_SAFE_INTEGER, counts),
      max : counts[k].reduce((max, v) => v > max ? v : max, 0, counts),
      n : counts[k].length,
      avg : counts[k].reduce((acc, v) => acc+v, 0)/counts[k].length
    }
  });
  return out;
}



export function doTest<T>(tests:FunctionMap<T>, data:()=>T, iterations:number = ITERATIONS) {
  let out:any[][] = [];
  let keys = Object.keys(tests);
  out.push(['Mixed', test(tests, data, iterations)]);

  keys.forEach(k => {
    let o:{[key:string]:(input:T)=>void} = {};
    o[k] = tests[k];
    out.push([`All ${k}`, test(o, data, iterations)])
  })

  out.forEach(p => {
    log(p[0], p[1]);
  })

  let d = data()
  let orig = tests[keys[0]](d);
  keys.slice(1).reduce((a,b) => {
    let cur = tests[b](d);
    let eq = areEqual(cur, orig);;
    if (!eq) {
      console.log(cur);
      console.log("===============")
      console.log(orig);
    }
    console.log(eq);
    return cur; 
  }, orig)
} 