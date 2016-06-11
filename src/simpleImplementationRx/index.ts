import * as esprima from "esprima";
import * as escodegen from "../lib/escodegen";
import * as AST from '../lib/ast';
import {genSymbol, parse, compile, visit, rewrite, visitor} from "../lib/util";
import * as helper from "../lib/util/helper";
import * as Transformers from './transformers';

type Transformer = ((...args:any[])=>any)


abstract class Collector<I,O> {
  protected changed:boolean = false;
  protected computed:(v:I)=>O;

  abstract getInitAST()
  abstract getCollectAST(ret:AST.Identifier, el:AST.Identifier)

  constructor(protected source:I, protected transformers:Transformer[] = []) {
    this.changed = this.transformers.length > 0
  }

  compute() {
    let fns = this.transformers.map(x => parse)
    let itr = helper.Id();
    let el = helper.Id();
    let arr = helper.Id();
    let temp = helper.Id();
    let ret = helper.Id()

    let vars:AST.Node[] = []
    let body:AST.Node[] = []
         
    this.transformers
      .reverse()
      .map(t => Transformers[t['type']](parse(t), el, ret))
      .reverse()
      .forEach(e => {
        body.push(...e.body)
        vars.push(...e.vars);
      }); 

    //Handle collector
    let collect = this.getCollectAST(ret, el);
    let init = this.getInitAST()

    if (init) vars.push(ret, init);
    if (collect) body.push(collect);

    let ast = helper.Func(temp, [arr], [
      helper.Vars('let', ...vars),
      helper.ForLoop(itr, helper.Literal(0), helper.GetProperty(arr, "length"),
        [
          helper.Vars('let', el, helper.GetProperty(arr, itr)),
          ...body
        ]        
      ),
      helper.Return(ret)
    ]);
    return compile(ast as any as AST.FunctionExpression, {}) as any
  }

  exec():O {
    if (this.changed) {
      this.changed = false;
      this.computed = this.compute(); 
    }
    return this.computed(this.source);
  }
}

export class ArraySource<T> {
  constructor(private source:T[]) {
  }

  filter(fn:(e:T, i?:number)=>boolean):ArrayCollector<T, T, T> {
    fn['type'] = 'filter'
    return new ArrayCollector<T,T,T>(this.source, [fn as Transformer]);
  }

  map<U>(fn:(e:T, i?:number)=>U):ArrayCollector<T, T, U> {
    fn['type'] = 'map'
    return new ArrayCollector<T, T, U>(this.source, [fn as Transformer]);
  }

  reduce<U>(fn:(acc:U, e:T)=>U, init:U):AnyCollector<T, U> {
    fn['type'] = 'reduce'
    return new AnyCollector<T, U>(init, this.source, [fn as Transformer]);
  }
}

export class AnyCollector<T, U> extends Collector<T[], U> {
  constructor(protected init:U, source:T[], transformers:Transformer[] = []) {
    super(source, transformers);    
  }

  getInitAST() {
    return helper.Literal(this.init);
  }

  getCollectAST() {
    return null;
  }
}

export class ArrayCollector<T, U, V> extends Collector<T[], V[]> {
  constructor(source:T[], transformers:Transformer[] = []) {
    super(source, transformers);
  }

  getInitAST() {
    return helper.Array();
  }

  getCollectAST(ret:AST.Identifier, el:AST.Identifier) {
    return helper.Expr(helper.Call(helper.GetProperty(ret, 'push'), el))
  }
   
  filter(fn:(e:V, i?:number)=>boolean):ArrayCollector<T, U, V> {
    this.changed = true;
    fn['type'] = 'filter'
    this.transformers.push(fn)
    return this
  }

  map<W>(fn:(e:V, i?:number)=>W):ArrayCollector<T, V, W> {
    this.changed = true;
    fn['type'] = 'map'
    return new ArrayCollector<T, V, W>(this.source, this.transformers.concat(fn));
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W):AnyCollector<T, W> {
    this.changed = true;
    fn['type'] = 'reduce'
    return new AnyCollector<T, W>(init, this.source, this.transformers.concat(fn));
  }
}