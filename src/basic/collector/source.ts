import {ArrayCollector} from './array';
import {AnyCollector} from './any';

export class ArraySource<T> {
  constructor(private source:T[]) {
  }

  filter(fn:(e:T, i?:number)=>boolean):ArrayCollector<T, T, T> {    
    return new ArrayCollector<T,T,T>(this.source).filter(fn);
  }

  map<U>(fn:(e:T, i?:number)=>U):ArrayCollector<T, T, U> {
    return new ArrayCollector<T, T, T>(this.source).map(fn);
  }

  reduce<U>(fn:(acc:U, e:T)=>U, init:U):AnyCollector<T, U> {
    return new ArrayCollector<T, T, T>(this.source).reduce(fn, init);
  }
}