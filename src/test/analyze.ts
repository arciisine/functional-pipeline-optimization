import { Analyzer } from '../transform';

let res = Analyzer.getFunctionAnalysis(Analyzer.getFunctionAnalysis);

console.log(res);