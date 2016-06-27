import {ArrayCompilable} from './compilable';
import  {ArrayCompiler} from './compiler';

declare global {
  interface Array<T> {
    r:ArrayProxy<T>;
  }
}

interface BaseProxy<T> {
  exec():T
  execManual():T
}

class ArrayProxy<T> implements BaseProxy<T> {

  private compilable = new ArrayCompilable<T, T, T>();
  private compiler = new ArrayCompiler<T, T>();

  constructor(protected data:T[]) {}

  filter(fn:(v:T, i?:number)=>boolean):ArrayProxy<T> {
    this.compilable = this.compilable.filter(fn);
    return this;
  }

  map<W>(fn:(v:T, i?:number)=>W):ArrayProxy<W> {
    this.compilable = this.compilable.map(fn) as any;
    return this as any;
  }

  reduce<W>(fn:(acc:W, v:T, i?:number, arr?:T[])=>W, init?:W):BaseProxy<W> {
    this.compilable = this.compilable.reduce(fn, null, init) as any;
    return this as any;
  }

  forEach(fn:(v:T, i?:number)=>void):BaseProxy<void> {
    this.compilable = this.compilable.forEach(fn) as any;
    return this as any;
  }

  find(fn:(v:T, i?:number, arr?:T[])=>boolean):BaseProxy<T> {
    this.compilable = this.compilable.find(fn) as any;
    return this as any;
  }

  some(fn:(v:T, i?:number)=>boolean):BaseProxy<boolean> {
    this.compilable = this.compilable.some(fn) as any;
    return this as any;
  }

  exec():T {
    return this.compiler.exec(this.compilable, this.data as any);
  }

  execManual():T {
    return this.compiler.execManual(this.compilable, this.data as any);
  }
}

Object.defineProperty(Array.prototype, 'r', {
  get : function() {
    return new ArrayProxy(this);
  }
});