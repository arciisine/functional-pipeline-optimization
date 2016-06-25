import {ArrayCollector} from './collector/array';

declare global {
  interface Array<T> {
    r(globals?:any):ArrayCollector<T, T, T>;
  }
}

Array.prototype.r = function(globals={}) {
    return new ArrayCollector(this, globals);
};