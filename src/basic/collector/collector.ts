import {Transformer, annotate, Transformers, Manual, TransformReference, TransformResponse} from '../transformer';
import {AST, Transform, Macro as m} from '../../../node_modules/ecma-ast-transform/src';

export abstract class Collector<I,O> {
  static cache:{[key:string]:Transformer} = {};

  protected key:string = null
  abstract getInitAST()
  abstract getCollectAST(ret:AST.Identifier, el:AST.Identifier)

  constructor(protected source:I[], protected transformers:Transformer[] = []) {
    this.transformers = this.transformers.map(annotate);
  }

  compute() {
    let fns = this.transformers.map(x => Transform.parse)
    let itr = m.Id();
    let el = m.Id();
    let arr = m.Id();
    let temp = m.Id();
    let ret = m.Id()
    let label = m.Id()

    let vars:AST.Node[] = []
    let body:AST.Node[] = []
         
    this.transformers
      .reverse()
      .map(t => {
        let tfn = Transformers[t['type']] as ((ref:TransformReference) => TransformResponse)
        return tfn({node:Transform.parse(t), element:el, ret, continueLabel:label})
      })
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

    let ast = m.Func(temp, [arr], [
      m.Vars('let', ...vars),
      m.Labeled(label,
        m.ForLoop(itr, m.Literal(0), m.GetProperty(arr, "length"),
          [
            m.Vars('let', el, m.GetProperty(arr, itr)),
            ...body
          ]        
        )
      ),
      m.Return(ret)
    ]);
    return Transform.compile(ast as any as AST.FunctionExpression, {}) as any
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
