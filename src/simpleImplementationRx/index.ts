import * as esprima from "esprima";
import * as escodegen from "../lib/escodegen";
import * as AST from "../lib/ast";

abstract class Collector<U> {
  abstract exec():U
}

export class Iterator<T> extends Collector<T[]> {

  constructor(private source:T[]) {
    super()
  }

  private transformers:((...args:any[])=>any)[]

  exec():T[] {
    return []
  }

  filter(fn:(e:T)=>boolean):Iterator<T> {
    this.transformers.push(fn)
    return this
  }

  map<U>(fn:(e:T)=>U):Iterator<U> {
    this.transformers.push(fn)
    return this as any as Iterator<U>
  }

  reduce<U>(fn:(acc:U, e:T)=>U):Collector<U> {
    this.transformers.push(fn);
    return this as any as Collector<U>
  }
    
}