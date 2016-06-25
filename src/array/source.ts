import {ArrayCollector} from './collector/array';

declare global {
  interface Array<T> {
    r:ArrayCollector<T, T, T>;
  }
}

Object.defineProperty(Array.prototype, 'r', {
  get : function() {
    return new ArrayCollector(this);
  }
});