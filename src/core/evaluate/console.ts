import {TestUtil} from './util';

if (process.argv.length < 5) {
  console.error("Usage <path.to.loader> <scenario name> <input range>x<iteration range>")
  process.exit(1)
}

let loader = require(`../../../src/${process.argv[2].split('.').join('/')}`).default;
let data = loader(process.argv[3])
let tests = TestUtil.testInputs([process.argv[4]]);
let res = TestUtil.runTests(data, tests); 
console.log(TestUtil.buildTable(res));