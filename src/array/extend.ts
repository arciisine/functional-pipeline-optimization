import {ArrayCompilable} from './compilable';

declare global {
  interface Array<T> {
    r:ArrayCompilable<T, T, T>;
  }
}

Object.defineProperty(Array.prototype, 'r', {
  get : function() {
    return new ArrayCompilable(this);
  }
});