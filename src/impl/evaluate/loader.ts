import '../body/bootstrap';
import {BodyTransformHandler} from '../body';
import {TestUtil, TestScenario} from '../../core';
import * as fs from "fs";

export default function(testName):TestScenario<any> {
  let file = `scenarios/${testName}`;
  let content = fs.readFileSync(`${__dirname}/${file}.js`).toString();
  let out = BodyTransformHandler.transform(content)
  fs.writeFileSync(`${__dirname}/${file}.alt.js`, out);
  return require(`./${file}.alt.js`)['default'] as TestScenario<any>;
}
