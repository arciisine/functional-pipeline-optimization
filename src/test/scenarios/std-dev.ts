import {TestUtil} from '../util';


function Manual(a:number[]) {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    total += a[i];
  }
  let mean = total/a.length;
  let totalSquared = 0;
  for (let i = 0; i < a.length; i++) {
    totalSquared += Math.pow(a[i] - mean, 2);
  }
  let stddev = Math.sqrt(totalSquared/ a.length);
  return [mean, totalSquared, stddev];
}

function Functional(a:number[]) {
  let mean = a.reduce((sum, x) => sum + x, 0) / a.length;
  let total = a.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
  let stddev = Math.sqrt(total / a.length);
  return [mean, total, stddev];
}

function Optimized(a:number[]) {
  "use optimize";
  let mean = a.reduce((sum, x) => sum + x, 0) / a.length;
  let total = a.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
  let stddev = Math.sqrt(total / a.length);
  return [mean, total, stddev];
}

export default {
  tests         : {Manual, Functional, Optimized},
  data          : TestUtil.makeRandomArray
}