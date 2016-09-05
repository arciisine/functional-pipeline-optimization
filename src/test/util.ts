import * as fs from "fs";
import * as zlib from "zlib";
import '../impl/body/bootstrap';

const DATA_SIZE = 1000;

let toInt = n => Math.trunc(Math.ceil(n))

export interface TestResults {
  n:number,
  iter:number,
  min:number,
  max:number,
  median:number,
  avg:number,
  wavg:number,
};

export interface TestResultMap {
  [key:string]:TestResults
}

export interface TestScenario<T> {
  tests:FunctionMap<T>, 
  maxInputSize: number,
  data:(number)=>T
};

export type TestInput  = [number,number];

export interface TestCase<T> {
  tests:FunctionMap<T>, 
  data:(number)=>T, 
  input:TestInput
};


export interface FunctionMap<T> {
   [key:string]:(nums:T)=>any
}

let fileCache = {};


export class TestUtil {

  static makeRandomArray(size:number):number[] {
    let data:number[] = Array(size);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.trunc(Math.random() * 255);
    }
    return data
  }

  static readFile(name:string, cache:boolean = true):string {
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

  static areEqual(a, b):boolean {
    if (typeof a !== typeof b) {
      return false;
    }
    switch (typeof a) {
      case 'boolean':
      case 'string':
      case 'number':
        return a === b
      case 'function':
        return TestUtil.areEqual(a.toString(), b.toString());
      default:
        if (Array.isArray(a)) {
          if (!Array.isArray(b) || !(a.length === b.length)) {
            return false;
          }
          let res = true;
          for (let i = 0; res && i < a.length; i++) {
            res = res && TestUtil.areEqual(a[i], b[i]);
          }
          return res;
        } else { //Object
          let keys = Object.keys(a);
          let bkeys = Object.keys(b);
          if (!TestUtil.areEqual(keys, bkeys)) {
            return false;
          }
          let res = true;
          for (let i = 0; i < keys.length; i++) {
            res = res && TestUtil.areEqual(a[keys[i]], b[keys[i]])
          }
          return res;
        }       
    }
  }

  static test<T>({tests, data, input}:TestCase<T>) {
    let counts:{[key:string]:number[]} = {};
    let keys = Object.keys(tests);
    let time = 0;
    keys.forEach(t =>  counts[t] = []);

    let d = data(input[0]) 
  
    for (let i = 0; i < input[1]; i++) {
      let k = keys[Math.max(0, Math.min(keys.length-1, Math.trunc(Math.random()*keys.length)))];
      let start = process.hrtime()
      tests[k](d)
      let [sec, nano] = process.hrtime(start)
      counts[k].push((sec*1e6 + nano)/input[0]);
    }

    let out:TestResultMap = {};
    keys.forEach(k => {
      let data = counts[k].sort();
      let len = data.length
      let mid = Math.trunc(len/2)
      let wstart = Math.trunc(len * .1)
      let wend   = Math.trunc(len * .9)

      out[k] = {
        n      : input[0],
        iter   : input[1],
        min    : data.reduce((min, v) => v < min ? v : min, Number.MAX_SAFE_INTEGER),
        max    : data.reduce((max, v) => v > max ? v : max, 0),
        median : data[mid],
        avg    : data.reduce((acc, v) => acc+v, 0)/len,
        wavg   : len > 1 ? data.slice(wstart, wend).reduce((acc, v) => acc+v, 0)/(wend-wstart) : data[0]
      }
    });
    return out;
  }

  static validateTests<T>({tests,data,input}:TestCase<T>) {
    let keys = Object.keys(tests);
    let d = data(input[0])
    let orig = tests[keys[0]](d);
    let invalid = null;
    keys.slice(1).reduce((a,b) => {
      let cur = tests[b](d);
      let eq = TestUtil.areEqual(cur, orig);;
      if (!eq) {
        invalid = [[cur, b], [orig, keys[0]]]
      }
      return cur; 
    }, orig)
    return !invalid;
  }

  static runTests<T>({tests, data}:TestScenario<T>, testInputs:TestInput[]):TestResultMap[] {
    let out = [];
    let keys = Object.keys(tests);

    if (!TestUtil.validateTests({tests, data, input:testInputs[0]})) {
      throw new Error("Tests are invalid"); 
    }

    keys.forEach(t => {
      tests[t](data(testInputs[0][0]))
    });

    for (let input of testInputs) {
      let individual:TestResultMap = {}

      keys.forEach(k => {
        let o:FunctionMap<T> = {};
        o[k] = tests[k];
        individual[k] = TestUtil.test({tests:o, data, input})[k];
      })
      out.push(individual);
    }
    return out;
  }

  static expandIterations(op) {
    if (op.indexOf('..') > 0) {
      let [start,stop,step] = op.split('..').map(x => +x);
      step = step || 1;
      let out = [];        
      for (let i = start; i <= stop; i+= step) {
        out.push(''+i);
      }
      return out.join(',');
    } else {
      return op;
    }
  }

  static testInputs(data:string[]):TestInput[] {
    return data.map(x => {
      let [a,b] = x.split('x').map(TestUtil.expandIterations);
      let asl = a.split(',').map(x => +x);
      let bsl = b.split(',').map(x => +x);

      let out = [];
      for (let asi of asl) {
        for (let bsi of bsl) {
          out.push([asi, bsi])
        }
      }
      return out;
    }).reduce((flat, arr) => flat.push(...arr) && flat, []);
  }

  static buildTable(data:TestResultMap[]):string {
    let out:any[][] = [
      ['test', 'n', 'iter', 'wavg', 'median', 'min', 'avg', 'max']
    ];

    let keys = Object.keys(data[0]);

    for (let result of data) {
      for (let key of keys) {
        let m = result[key];
        out.push([
          key,
          m.n,
          m.iter, 
          m.wavg.toFixed(3),
          m.median.toFixed(3), 
          m.min.toFixed(3), 
          m.avg.toFixed(3), 
          m.max.toFixed(3)
        ]);
      }
    }
    function pad(len, x) {
      let str = `${x}`;
      while (str.length < len) {
        str = str + ' ';
      }
      return str;
    }
    return out.map(y => y.map(pad.bind(null, 12)).join('|')).join('\n');
  }
}