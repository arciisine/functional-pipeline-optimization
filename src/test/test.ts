import {BodyTransformHandler} from '../impl/body';
import {TestUtil, TestScenario} from './util';
import * as fs from "fs";

let testName = process.argv[2];
let iters = parseInt(process.argv[3]);

let file = `scenarios/${testName}`;
let content = fs.readFileSync(`${__dirname}/${file}.js`).toString();
let out = BodyTransformHandler.transform(content)
fs.writeFileSync(`${__dirname}/${file}.alt.js`, out);
let data:TestScenario<any> = require(`./${file}.alt.js`)['default'];

let res = TestUtil.runTestSuite(data, 
  {start:.1, stop:1, step:.1}, 
  {start:1, stop:iters, step: iters/10}
);


console.log(res);