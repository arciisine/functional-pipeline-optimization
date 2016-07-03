import  {ArrayProxy} from './proxy';

declare global {
  interface Array<T> {
    r:ArrayProxy<T>;
  }
}

Object.defineProperty(Array.prototype, 'r', {
  get : function() {
    return new ArrayProxy(this);
  }
});