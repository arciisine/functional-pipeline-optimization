import  {ArrayBuilder} from './builder';

declare global {
  interface Array<T> {
    r:ArrayBuilder<T, any>;
  }
}

Object.defineProperty(Array.prototype, 'r', {
  get : function() {
    return new ArrayBuilder(this);
  }
});