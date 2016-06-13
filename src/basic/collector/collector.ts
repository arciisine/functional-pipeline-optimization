import {Transformer, annotate, Transformers, Manual} from '../transformer';
import {helper, Utils} from '../../lib/ast';
import * as AST from '../../lib/ast/types';

export abstract class Collector<I,O> {
  static cache:{[key:string]:Transformer} = {};

  protected key:string = null
  abstract getInitAST()
  abstract getCollectAST(ret:AST.Identifier, el:AST.Identifier)

  constructor(protected source:I[], protected transformers:Transformer[] = []) {
    this.transformers = this.transformers.map(annotate);
  }

  compute() {
    let fns = this.transformers.map(x => Utils.parse)
    let itr = helper.Id();
    let el = helper.Id();
    let arr = helper.Id();
    let temp = helper.Id();
    let ret = helper.Id()
    let label = helper.Id()

    let vars:AST.Node[] = []
    let body:AST.Node[] = []
         
    this.transformers
      .reverse()
      .map(t => Transformers[t['type']](Utils.parse(t), el, ret, label))
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
      helper.Labeled(label,
        helper.ForLoop(itr, helper.Literal(0), helper.GetProperty(arr, "length"),
          [
            helper.Vars('let', el, helper.GetProperty(arr, itr)),
            ...body
          ]        
        )
      ),
      helper.Return(ret)
    ]);
    return Utils.compile(ast as any as AST.FunctionExpression, {}) as any
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
      data = Manual[t['type']](data, t);
    })
    return data as any as O;
  }
}
