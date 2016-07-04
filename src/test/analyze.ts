import {Analyzer} from '../transform/analyze';

declare var e, f;
declare var global;

let res = Analyzer.getFunctionAnalysis(function test(a,b) {
  var c = 5;
  e +5;
  let d = a+b;
  return c+(String.fromCharCode(10) as any) * f();
}, global)

console.log(res);