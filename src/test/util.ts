import * as fs from "fs";
import * as zlib from "zlib";
import '../impl/body/bootstrap';

const DATA_SIZE = 1000;

export interface TestResults {
  min:number,
  max:number,
  n:number,
  avg:number
};

export interface TestResultMap {
  [key:string]:TestResults
}

export interface Range {
  start:number, 
  stop?:number, 
  step?:number
}

export interface TestScenario<T> {
  tests:FunctionMap<T>, 
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
    let counts = {};
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
        counts[k].push(sec/1000 + nano/1e9);
      } catch(e) {
        console.log(e ,k);
      }
    }

    let out:TestResultMap = {};
    keys.forEach(k => {
      out[k] = {
        min : counts[k].reduce((min, v) => v < min ? v : min, Number.MAX_SAFE_INTEGER, counts),
        max : counts[k].reduce((max, v) => v > max ? v : max, 0, counts),
        n   : counts[k].length,
        avg : counts[k].reduce((acc, v) => acc+v, 0)/counts[k].length
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

  static execTest<T>({tests, data, inputSize, iterations}:TestCase<T>) {
    let out:TestResultMap = {};
    let keys = Object.keys(tests);
    let individual:TestResultMap = {}
    let mixed = TestUtil.test({tests, data, inputSize, iterations});

    keys.forEach(k => {
      let o:FunctionMap<T> = {};
      o[k] = tests[k];
      individual[k] = TestUtil.test({tests:o, data, inputSize, iterations})[k];
    })
    
    return [mixed, individual]
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

  static runTestSuite<T>({tests, data}:TestScenario<T>, inputSize:Range, iterations:Range, ) {
    TestUtil.validateRange(inputSize);
    TestUtil.validateRange(iterations);
    let out = [];
    for (let {start:i, stop:istop, step:istep} = iterations; i <= istop; i+= istep) {
      for (let {start:j, stop:jstop, step:jstep} = inputSize; j <= jstop; j+= jstep) {
        let ret = TestUtil.execTest({tests, data, inputSize:j, iterations:i});
        out.push({inputSize:j, iterations:i, results:ret});
      }  
    }
    return out;
  }
}