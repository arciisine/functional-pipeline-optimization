import {ArrayCompilable} from './compilable';
import  {ArrayCompiler} from './compiler';
import * as Transform from './transform';

declare global {
  interface Array<T> {
    r:ArrayProxy<T>;
  }
}

interface TerminalProxy<T> {
  exec():T
  execManual():T
}

class ArrayProxy<T> implements TerminalProxy<T> {

  private compilable = new ArrayCompilable<T, T, T>();
  private compiler = new ArrayCompiler<T, T>();

  constructor(protected data:T[]) {}

  filter(fn:(v:T, i?:number)=>boolean, context?:any):ArrayProxy<T> {
    this.compilable.add(new Transform.FilterTransform(fn, context));
    return this;
  }

  map<W>(fn:(v:T, i?:number)=>W, context?:any):ArrayProxy<W> {
    this.compilable.add(new Transform.MapTransform(fn, context));
    return this as any;
  }

  reduce<W>(fn:(acc:W, v:T, i?:number, arr?:T[])=>W, init?:W, context?:any):TerminalProxy<W> {
    this.compilable.add(new Transform.ReduceTransform(fn, init, context));
    return this as any;
  }

  forEach(fn:(v:T, i?:number)=>void, context?:any):TerminalProxy<void> {
    this.compilable.add(new Transform.ForEachTransform(fn,context));
    return this as any;
  }

  find(fn:(v:T, i?:number, arr?:T[])=>boolean, context?:any):TerminalProxy<T> {
    this.compilable.add(new Transform.FindTransform(fn,context));
    return this as any;
  }

  some(fn:(v:T, i?:number)=>boolean, context?:any):TerminalProxy<boolean> {
    this.compilable.add(new Transform.SomeTransform(fn,context));
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