import * as fs from "fs";
import * as zlib from "zlib";
import '../impl/body/bootstrap';

const DATA_SIZE = 1000;

export interface TestResults {
  min:number,
  max:number,
  median:number,
  n:number,
  avg:number,
  wavg:number,
};

export interface TestResultMap {
  [key:string]:TestResults
}

export interface TestCaseResult { 
  mixed:TestResultMap, 
  individual:TestResultMap
}

export interface Range {
  start:number, 
  stop?:number, 
  step?:number
}

export interface TestScenario<T> {
  tests:FunctionMap<T>, 
  maxInputSize: number,
  data:(number)=>T
};

export interface TestCase<T> {
  tests:FunctionMap<T>, 
  data:(number)=>T, 
  iterations:number,
  inputSize:number
};


export interface FunctionMap<T> {
   [key:string]:(nums:T)=>any
}

let fileCache = {};


export class TestUtil {

  static makeRandomArray(size:number):number[] {
    if (size < 1) {
      size = parseInt('' + DATA_SIZE*size);
    }

    let data:number[] = Array(size);
    for (let i = 0; i < data.length; i++) {
      data[i] = parseInt(''+(Math.random() * 255));
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

  static log(title, o){
    console.log(title)
    console.log('='.repeat(20)) 
    console.log(JSON.stringify(o, null, 2))
    console.log()
  }

  static test<T>({tests, data, inputSize, iterations}:TestCase<T>) {
    let counts:{[key:string]:number[]} = {};
    let keys = Object.keys(tests);
    keys.forEach(t => {
      counts[t] = []
      tests[t](data(inputSize))
    });

    let time = 0;

    let d = data(inputSize) 
  
      for (let i = 0; i < iterations; i++) {
      let k = keys[Math.max(0, Math.min(keys.length-1, parseInt(Math.random()*keys.length as any)))];
      let start = process.hrtime()
      try {
        tests[k](d)
        let [sec, nano] = process.hrtime(start)
        counts[k].push(sec*1e6 + nano);
      } catch(e) {
        console.log(e ,k);
      }
    }

    let out:TestResultMap = {};
    keys.forEach(k => {
      let data = counts[k].sort();
      let len = data.length
      let mid = parseInt(''+Math.ceil(len/2))
      let wstart = parseInt(''+Math.floor(len * .1))
      let wend   = parseInt(''+Math.floor(len * .9))

      out[k] = {
        min    : data.reduce((min, v) => v < min ? v : min, Number.MAX_SAFE_INTEGER),
        max    : data.reduce((max, v) => v > max ? v : max, 0),
        median : data[mid],
        n      : len,
        avg    : data.reduce((acc, v) => acc+v, 0)/len,
        wavg   : data.slice(wstart, wend).reduce((acc, v) => acc+v, 0)/(wend-wstart)
      }
    });
    return out;
  }

  static validateTests<T>({tests,data,inputSize}:TestCase<T>) {
    let keys = Object.keys(tests);
    let d = data(inputSize)
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
    return invalid;
  }

  static validateRange(range:Range) {
    if (range.stop === undefined) {
      range.stop = range.start;
    } else if (range.step == undefined) {
      range.step = (range.stop-range.start)/10;
    }
    return range;
  }

  static execTest<T>({tests, data, inputSize, iterations}:TestCase<T>):TestCaseResult {
    let out:TestResultMap = {};
    let keys = Object.keys(tests);
    let individual:TestResultMap = {}
    let mixed = TestUtil.test({tests, data, inputSize, iterations});

    keys.forEach(k => {
      let o:FunctionMap<T> = {};
      o[k] = tests[k];
      individual[k] = TestUtil.test({tests:o, data, inputSize, iterations})[k];
    })
    
    return {mixed, individual }
  } 

  static singleTest<T>(input:TestCase<T>) {
    let results = TestUtil.execTest(input);

    TestUtil.log('Mixed', results[0]);

    Object.keys(input.tests).forEach(k => {
      TestUtil.log(`All ${k}`, results[1][k])
    })

    let invalid = TestUtil.validateTests(input);
    if (invalid) {
      console.log(invalid);
    }
  } 

  static runTestSuite<T>({tests, data}:TestScenario<T>, inputSize:number, iterations:Range):TestCaseResult[] {
    TestUtil.validateRange(iterations);
    let out = [];
    for (let {start:i, stop:istop, step:istep} = iterations; i <= istop; i+= istep) {
      let ret = TestUtil.execTest({tests, data, inputSize, iterations:i});
      out.push(ret);
    }
    return out;
  }

  static buildTable(data:TestCaseResult[]):string {
    let out:any[][] = [
      ['test', 'n', 'wavg', 'median', 'min', 'avg', 'max']
    ];
    
    let keys = Object.keys(data[0].individual);

    for (let result of data) {
      for (let key of keys) {
        let m = result.individual[key];
        out.push([
          key, 
          m.n, 
          Math.round(m.wavg),
          m.median, 
          Math.round(m.min), 
          Math.round(m.avg), 
          Math.round(m.max)
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