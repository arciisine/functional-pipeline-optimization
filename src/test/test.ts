import {BodyTransformHandler} from '../impl/body';
import {TestUtil, TestScenario} from './util';
import * as fs from "fs";

function getNumber(val, def=0) {
  val = parseFloat(''+val);
  return Number.isNaN(val) || val <= 0 ? def : val;
}

let testName = process.argv[2];

let file = `scenarios/${testName}`;
let content = fs.readFileSync(`${__dirname}/${file}.js`).toString();
let out = BodyTransformHandler.transform(content)
fs.writeFileSync(`${__dirname}/${file}.alt.js`, out);
let data:TestScenario<any> = require(`./${file}.alt.js`)['default'];

let inputPercent = getNumber(process.argv[3]);
let inputSize = parseInt(`${data.maxInputSize * inputPercent}`)
let iterations = getNumber(process.argv[4], -1);
let iterationStepCount = getNumber(process.argv[5], 10);

let res = TestUtil.runTestSuite(data, 
  inputSize, 
  {start:parseInt(`${Math.max(1,.1*iterations)}`), stop:iterations, step:parseInt(`${Math.max(1, Math.floor(iterations/iterationStepCount))}`)}
);

console.log('InputSize', inputSize)
console.log(TestUtil.buildTable(res));