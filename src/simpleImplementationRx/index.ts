import * as esprima from "esprima";
import * as escodegen from "../lib/escodegen";
import * as AST from '../lib/ast';
import {genSymbol, parse, compile, visit, rewrite, visitor} from "../lib/util";
import * as helper from "../lib/util/helper";

type Transformer = ((...args:any[])=>any)

let TRANSFORMERS = {
  filter : (node:AST.Node, el:AST.Identifier) => {
    let params = null;       
    let res = visit(visitor({
      //FunctionExpression : extractBody,
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        params = node.params as AST.Identifier[]
        return helper.IfThen(helper.Negate(node.body), [helper.Continue()]);
      },
      Identifier : (id:AST.Identifier) => params && id.name == params[0].name ? el : id
    }), node);

    return (res as any as AST.ExpressionStatement).expression
  },
  map : (node:AST.Node, el:AST.Identifier) => {
    let params = null;
    let res = visit(visitor({
      //FunctionExpression : extractBody,
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        params = node.params as AST.Identifier[]
        return node.body;
      },
      Identifier : (id:AST.Identifier) => params && id.name == params[0].name ? el : id
    }), node);
    return helper.Assign(el, (res as any as AST.ExpressionStatement).expression)
  }
}

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
    let collect = this.getCollectAST(ret, el);

    let body:AST.Node[] = 
      this.transformers
        .reverse()
        .map(t => TRANSFORMERS[t['type']](parse(t), el))
        .map(x => helper.Expr)
        .reverse(); 

    let ast = helper.Func(temp, [arr], [
      helper.Vars('let', ret, this.getInitAST()),
      helper.ForLoop(itr, helper.Literal(0), helper.GetProperty(arr, "length"),
        [
          helper.Vars('let', el, helper.GetProperty(arr, itr)),
          ...body,
          collect
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
    console.log(this.computed);
    return this.computed(this.source);
  }
}

export class ArraySource<T> {
  constructor(private source:T[]) {
  }

  filter(fn:(e:T)=>boolean):ArrayCollector<T, T, T> {
    fn['type'] = 'filter'
    return new ArrayCollector<T,T,T>(this.source, [fn as Transformer]);
  }

  map<U>(fn:(e:T)=>U):ArrayCollector<T, T, U> {
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

  getCollectAST(ret:AST.Identifier, el:AST.Identifier) {
    return null;//helper.Call(helper.GetProperty(ret, 'push'), el)
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
    return helper.Call(helper.GetProperty(ret, 'push'), el)
  }
   
  filter(fn:(e:V)=>boolean):ArrayCollector<T, U, V> {
    this.changed = true;
    fn['type'] = 'filter'
    this.transformers.push(fn)
    return this
  }

  map<W>(fn:(e:V)=>W):ArrayCollector<T, V, W> {
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

let res = new ArraySource([1,2,3,4,5,6,7,8,9,10])
  .map(x => x * 2)
  .map(x => x + parseInt(`${Math.random()*100}`))
  .map(x => x.toString())
  .map(x => x.toUpperCase())
  .filter(x => x.indexOf('1') === 0)
  .map(x => parseInt(x))
  .exec()

console.log(res)