import {
  Transformer, 
  annotate, 
  Transformers, 
  TransformState
} from '../transformer';

import {Manual} from '../manual';

import {AST, Util, Macro as m} from '../../../node_modules/ecma-ast-transform/src';

export abstract class Collector<I,O> {
  static cache:{[key:string]:Transformer} = {};

  protected key:string = null
  protected pure:boolean = true;
  abstract getInitAST(state:TransformState):AST.Node
  abstract getCollectAST(state:TransformState):AST.Node

  constructor(protected source:I[], protected transformers:Transformer[] = []) {
    this.transformers = this.transformers.map(fn => {
      let res = annotate(fn);
      this.pure = this.pure && res.pure;
      return res;
    });
  }

  compute() {
    let itr = m.Id();
    let arr = m.Id();
    let temp = m.Id();

    let state:TransformState = {
      element: m.Id(),
      continueLabel : m.Id(),
      ret : m.Id()
    }; 

    let vars:AST.Node[] = []
    let body:AST.Node[] = []
         
    this.transformers
      .reverse()
      .map(t => {
        let tfn = Transformers[t.type]; 
        return tfn({node:Util.parse(t)}, state)
      })
      .reverse()
      .forEach(e => {
        body.push(...e.body)
        vars.push(...e.vars);
      }); 

    //Handle collector
    let collect = this.getCollectAST(state);
    let init = this.getInitAST(state)

    if (init) vars.push(state.ret, init);
    if (collect) body.push(collect);

    let ast = m.Func(temp, [arr], [
      m.Vars('let', ...vars),
      m.Labeled(state.continueLabel,
        m.ForLoop(itr, m.Literal(0), m.GetProperty(arr, "length"),
          [
            m.Vars('let', state.element, m.GetProperty(arr, itr)),
            ...body
          ]        
        )
      ),
      m.Return(state.ret)
    ]);
    return Util.compile(ast as any as AST.FunctionExpression, {}) as any
  }

  getComputed() {
    if (this.key === null) {
      this.key = this.transformers.map(x => x.id).join('|');
    }
    if (!Collector.cache[this.key]) {
      Collector.cache[this.key] = this.compute(); 
    }
    return Collector.cache[this.key];
  }

  exec(data:I[] = this.source):O {
    //Short circuit if dealing with impure functions
    if (!this.pure) {
      return this.execManual(data);
    } else {
      return this.getComputed().call(this, data);
    }
  }

  execManual(data:I[] = this.source):O {
    this.transformers.slice(0, this.transformers.length-1).forEach((t, i) => {
      data = Manual[t.type](data, t);
    })
    let finalTfn = this.transformers[this.transformers.length - 1];
    data = Manual[finalTfn.type](data, finalTfn, this['init'] || undefined);
    return data as any as O;
  }
}
