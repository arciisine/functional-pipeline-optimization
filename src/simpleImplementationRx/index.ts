import * as esprima from "esprima";
import * as escodegen from "../lib/escodegen";
import * as AST from '../lib/ast';
import {genSymbol, parse, compile} from "../lib/util";
import * as helper from "../lib/util/helper";

abstract class Collector<U> {
  abstract exec():U
}

export class Iterator<T> extends Collector<T[]> {

  constructor(private source:T[]) {
    super()
  }

  private transformers:((...args:any[])=>any)[] = []

  exec():T[] {
    let fns = this.transformers.map(x => parse)
    let itr = helper.Id();
    let arr = helper.Id();
    let temp = helper.Id();

    let ast = helper.Func(temp, [arr], [ 
      helper.ForLoop(itr, helper.Literal(0), helper.GetProperty(arr, "length"), null)
    ]);
    return compile(ast as any as AST.FunctionExpression, {}) as any
  }

  filter(fn:(e:T)=>boolean):Iterator<T> {
    fn['type'] = 'filter'
    this.transformers.push(fn)
    return this
  }

  map<U>(fn:(e:T)=>U):Iterator<U> {
    fn['type'] = 'map'
    this.transformers.push(fn)
    return this as any as Iterator<U>
  }

  reduce<U>(fn:(acc:U, e:T)=>U):Collector<U> {
    fn['type'] = 'reduce'
    this.transformers.push(fn);
    return this as any as Collector<U>
  }    
}

let res = new Iterator([1,2,3,4,5,6,7,8,9,10])
  .map(x => x * 2)
  .map(x => x + parseInt(`${Math.random()*100}`))
  .filter(x => x % 2 == 0)
  .exec()

  console.log(res)