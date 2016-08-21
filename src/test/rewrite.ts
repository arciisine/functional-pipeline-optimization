import {BodyTransformHandler} from '../impl/body';

import * as fs from "fs";

let test = 'text-analysis';

let content = fs.readFileSync(`${__dirname}/${test}.js`).toString();

let out = BodyTransformHandler.transform(content)

console.log(out);

fs.writeFileSync(`${__dirname}/${test}.alt.js`, out);

eval(out);