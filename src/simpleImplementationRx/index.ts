import * as esprima from "esprima";
import * as escodegen from "../lib/escodegen";
import * as AST from '../lib/ast';
import {genSymbol, parse, compile, visit, rewrite, visitor} from "../lib/util";
import * as helper from "../lib/util/helper";
import {Transformers, Transformer, Manual} from './transformers';
import {md5} from '../lib/md5';

let annotate = (function() {
  let cache = {};

  let i = 0;
  return (fn:Transformer):Transformer => {
    if (!fn['key']) {
      fn['key'] = md5(fn.toString());
    }

    let fnKey = fn['key'];
    
    if (cache[fnKey]) {
      fn = cache[fnKey];
    } else {
      cache[fnKey] = fn;
    }
    if (!fn['id']) fn['id'] = i++;

    return fn;
  };
})()

let tag = (fn, name) => fn['type'] = name;

export abstract class Collector<I,O> {
  static cache:{[key:string]:Transformer} = {};

  protected key:string = null
  abstract getInitAST()
  abstract getCollectAST(ret:AST.Identifier, el:AST.Identifier)

  constructor(protected source:I[], protected transformers:Transformer[] = []) {
    this.transformers = this.transformers.map(annotate);
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

  exec(data:I[] = this.source):O {
    if (this.key === null) {
      this.key = this.transformers.map(x => x['id']).join('|');
    }
    if (!Collector.cache[this.key]) {
      Collector.cache[this.key] = this.compute(); 
    }
    return Collector.cache[this.key](data);
  }

  execManual(data:I[] = this.source):O {
    this.transformers.forEach(t => {
      data = Manual[t['type']](data);
    })
    return data as any as O;
  }
}

export class ArraySource<T> {
  constructor(private source:T[]) {
  }

  filter(fn:(e:T, i?:number)=>boolean):ArrayCollector<T, T, T> {    
    tag(fn, 'filter');
    return new ArrayCollector<T,T,T>(this.source, [fn]);
  }

  map<U>(fn:(e:T, i?:number)=>U):ArrayCollector<T, T, U> {
    tag(fn, 'map');
    return new ArrayCollector<T, T, U>(this.source, [fn]);
  }

  reduce<U>(fn:(acc:U, e:T)=>U, init:U):AnyCollector<T, U> {
    tag(fn, 'reduce');
    return new AnyCollector<T, U>(init, this.source, [fn]);
  }
}

export class AnyCollector<T, U> extends Collector<T, U> {
  constructor(protected init:U, source:T[], transformers:Transformer[] = []) {
    super(source, transformers);
    transformers[transformers.length - 1]['init'] = JSON.stringify(init);
  }

  getInitAST() {
    let src = `let a = ${JSON.stringify(this.init)}`;
    let res = (parse(src) as any).declarations[0].init;
    return res;
  }

  getCollectAST() {
    return null;
  }
}

export class ArrayCollector<T, U, V> extends Collector<T, V[]> {
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
    tag(fn, 'filter');
    return new ArrayCollector<T, U, V>(this.source, [...this.transformers,fn]);
  }

  map<W>(fn:(e:V, i?:number)=>W):ArrayCollector<T, V, W> {
    tag(fn, 'map');
    return new ArrayCollector<T, V, W>(this.source, [...this.transformers,fn]);
  }

  reduce<W>(fn:(acc:W, e:V)=>W, init:W):AnyCollector<T, W> {
    tag(fn, 'reduce');
    return new AnyCollector<T, W>(init, this.source, [...this.transformers,fn]);
  }
}