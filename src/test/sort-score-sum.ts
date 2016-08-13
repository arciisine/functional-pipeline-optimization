import {doTest, getNumberData} from './util';
import '../impl/array/bootstrap';
import * as fs from "fs";

function sortScoreSum(names:string[]) {
  return names
    .sort()
    .map((x,i) => {
      return (i+1) * x
        .split('')
        .map(x => x.charCodeAt(0) - 64)
        .reduce((acc, v) => acc+v, 0)
    })
    .reduce((acc,v) => acc+v, 0);
}

function sortScoreSumOpt(names:string[]) {
  'use optimize';

  return names
    .sort()
    .map((x,i) => {
      return (i+1) * x
        .split('')
        .map((x) => x.charCodeAt(0) - 64)
        .reduce((acc, v) => acc+v, 0 )
    })
    .reduce((acc,v) => acc+v, 0);
}


let names = fs.readFileSync("/Users/tim/School/MastersThesis/src/test/names.txt").toString().replace(/"/g, '').split(',');
doTest({sortScoreSum, sortScoreSumOpt}, () => names)