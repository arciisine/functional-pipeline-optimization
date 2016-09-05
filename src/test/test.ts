import {BodyTransformHandler} from '../impl/body';
import {TestUtil, TestScenario} from './util';
import * as fs from "fs";

function getNumber(val, def=0) {
  val = parseFloat(''+val);
  return Number.isNaN(val) || val < 0 ? def : val;
}

let testName = process.argv[2];

let file = `scenarios/${testName}`;
let content = fs.readFileSync(`${__dirname}/${file}.js`).toString();
let out = BodyTransformHandler.transform(content)
fs.writeFileSync(`${__dirname}/${file}.alt.js`, out);
let data:TestScenario<any> = require(`./${file}.alt.js`)['default'];

let tests = TestUtil.testInputs(process.argv.slice(3));

let res = TestUtil.runTests(data, tests); 
console.log(TestUtil.buildTable(res));