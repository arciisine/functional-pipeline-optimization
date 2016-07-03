import {Analyzer} from '../transform/analyze';

declare var e;
declare var global;

let res = Analyzer.findClosedVariables(function test(a,b) {
  var c = 5;
  e +5;
  let d = a+b;
  return c+String.fromCharCode(10);
}, global)

console.log(res);