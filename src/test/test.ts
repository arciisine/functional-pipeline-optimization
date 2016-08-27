import {BodyTransformHandler} from '../impl/body';
import {TestUtil, TestScenario} from './util';
import * as fs from "fs";

let testName = process.argv[2];
let args = process.argv.slice(3);

let file = `scenarios/${testName}`;
let content = fs.readFileSync(`${__dirname}/${file}.js`).toString();
let out = BodyTransformHandler.transform(content)
fs.writeFileSync(`${__dirname}/${file}.alt.js`, out);
let data:TestScenario<any> = require(`${file}.alt.js`);

console.log(TestUtil.runTestSuite(data))