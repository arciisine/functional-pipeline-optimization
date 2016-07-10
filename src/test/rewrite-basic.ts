/// <reference path="../../node_modules/@types/node/node-0.12.d.ts" />

import {rewriteBody} from '../impl/body';

import * as fs from "fs";

let content = fs.readFileSync(`${__dirname}/basic.js`).toString();

let out = rewriteBody(content)

fs.writeFileSync(`${__dirname}/basic.alt.js`, out);