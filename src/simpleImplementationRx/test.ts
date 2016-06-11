import {ArraySource} from './index';
import {doTest} from '../lib/test';

let wrapper = null;

function compiled(data:number[]) {
  if (wrapper === null) {
    wrapper = new ArraySource(data)
      .filter(x => x % 2 === 0)
      .map(x => x * 2)
      .map((x,i) => x.toString() + i)
      .map(x => parseInt(x))
      .reduce((acc, x) => acc + x, 0)
  }
  return wrapper.exec();
}

function raw(data:number[]) {
  return  data.filter(x => x % 2 === 0)
      .map(x => x * 2)
      .map((x,i) => x.toString() + i)
      .map(x => parseInt(x))
      .reduce((acc, x) => acc + x, 0)
}

doTest(compiled, raw);