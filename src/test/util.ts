import {Helper} from '../impl/array/bootstrap';

let data:number[] = null
export function getNumberData():number[] {
  let data:number[] = Array(1000);
  for (let i = 0; i < data.length; i++) {
    data[i] = parseInt(''+(Math.random() * 255));
  }
  return data
}

function test<T>(tests:{[key:string]:(nums:T[])=>void}, data:()=>T[]) {
  let counts = {};
  let keys = Object.keys(tests);
  keys.forEach(t => {
    counts[t] = []
    tests[t](data())
  });

  let time = 0;

  let d = data() 
  
  for (let i = 0; i < 100000; i++) {
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

function log(title, o){
  console.log(title)
  console.log('='.repeat(20)) 
  console.log(JSON.stringify(o, null, 2))
  console.log()
}

function areEqual(a, b):boolean {
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


export function doTest<T>(tests:{[key:string]:(input:T[])=>void}, data:()=>T[]) {
  let out:any[][] = [];
  let keys = Object.keys(tests);
  out.push(['Mixed', test(tests, data)]);

  keys.forEach(k => {
    let o:{[key:string]:(input:T[])=>void} = {};
    o[k] = tests[k];
    out.push([`All ${k}`, test(o, data)])
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