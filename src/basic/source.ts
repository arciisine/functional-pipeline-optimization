import {ArrayCollector} from './collector/array';

declare global {
  interface Array<T> {
    r():ArrayCollector<T, T, T>;
  }
}

Array.prototype.r = function() {
  return new ArrayCollector(this);
}