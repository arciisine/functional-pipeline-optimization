import {BodyTransformHandler} from '../impl/body';

import * as fs from "fs";

let content = fs.readFileSync(`${__dirname}/sort-score-sum.js`).toString();

let out = BodyTransformHandler.transform(content)

console.log(out);

fs.writeFileSync(`${__dirname}/sort-score-sum.alt.js`, out);

eval(out);