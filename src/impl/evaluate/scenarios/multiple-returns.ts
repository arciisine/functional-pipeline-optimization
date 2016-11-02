import { TestUtil } from '../../../core';

function Manual(a: number[]) {
  let out: any[] = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] < 10 || a[i] % 2 == 1) continue;
    out.push(a[i]);
  }
  return out;
}

function Functional(a: number[]) {
  return a.filter(id => {
    if (id > 10) {
      return true;
    }
    return id % 2 == 0;
  });
}

function Optimized(a: number[]) {
  "use optimize";
  return a.filter(id => {
    if (id > 10) {
      return true;
    }
    return id % 2 == 0;
  });
}

let ids = TestUtil.makeRandomArray(100000)

export default {
  tests: { Manual, Functional, Optimized },
  data: n => ids.slice(n)
}