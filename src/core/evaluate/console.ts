import {TestUtil} from './util';

let loader = require(`../../${process.argv[2].split('.').join('/')}`)
let data = loader(process.argv[3])
let tests = TestUtil.testInputs(process.argv.slice(4));
let res = TestUtil.runTests(data, tests); 
console.log(TestUtil.buildTable(res));