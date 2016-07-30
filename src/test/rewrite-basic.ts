import {BodyTransformHandler} from '../impl/body';

import * as fs from "fs";

let content = fs.readFileSync(`${__dirname}/basic.js`).toString();

let out = BodyTransformHandler.transform(content)

console.log(out);

fs.writeFileSync(`${__dirname}/basic.alt.js`, out);

eval(out);