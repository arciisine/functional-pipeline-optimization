import {TestUtil} from '../util';


function Manual(a:[number[], {[key:string]:any}]) {
  let out = [];
  for (let i = 0; i < a[0].length; i++) {
    out.push(a[1][a[0][i]]);
  }
  return out;
}

function Functional(a:[number[], {[key:string]:any}]) {
  return a[0].map(id => a[1][id]);
}

function Optimized(a:[number[], {[key:string]:any}]) {
  "use optimize";
  return a[0].map(id => a[1][id]);
}

let ids = TestUtil.makeRandomArray(100000)
let data = ids.map(id => ({ name : `name-${id}`, id })).reduce((acc, x) => (acc[x.id] = x) && acc, {}); 

export default {
  tests         : {Manual, Functional, Optimized},
  data          : n => [ids.slice(n), data]
}