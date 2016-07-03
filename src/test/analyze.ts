import {Analyzer} from '../transform/analyze';

declare var c;

Analyzer.findClosedVariables(function(a,b) {
  return a+b+c;
})