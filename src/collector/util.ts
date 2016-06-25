import {AST, Util as tUtil, Macro as m, Visitor} from '../../node_modules/ecma-ast-transform/src';
import {md5} from './md5';

export interface Transformable {
  (...args:any[]):any,
  key? : string,
  id? : number,
  type? : string,
  init?: any,
  globals?:any,
  pure?: boolean,
  parsed?:AST.Node
}

export interface Transformer {
  (ref:TransformReference, state:TransformState):TransformResponse
}

export interface TransformReference {
  node:AST.Node,
  params?:AST.Identifier[],
  onReturn?:(node:AST.ReturnStatement)=>AST.Node
}

export interface TransformState {
  element:AST.Identifier,
  ret?:AST.Identifier
  continueLabel?:AST.Identifier    
}

export interface TransformResponse {
  body:AST.Node[],
  vars:AST.Node[]
}

export interface Collector<I, O> {
  key:string;
  pure:boolean;
  chain:Transformable[],
  mapping:{[type:string]:Transformer}
  getCollectAST(state:TransformState):AST.Node
  getInitAST(state:TransformState):AST.Node
}

export class Util {
  private static i = 0;
  private static computed:{[key:string]:Transformable} = {};
  private static annotated:{[key:string]:Transformable} = {};

  static tag(fn:Transformable, name:string, globals?:any) {
    fn.type = name;
    fn.globals = globals;
  }

  static annotate(fn:Transformable):Transformable {
    if (fn.pure === undefined) {
      fn.pure = tUtil.isPureFunction(fn, fn.globals || {});
    } 

    if (fn.pure) {
      if (!fn.key) {
        fn.key = md5(fn.toString());
      }

      if (Util.annotated[fn.key]) {
        fn = Util.annotated[fn.key];
      } else {
        Util.annotated[fn.key] = fn;
      }

      if (!fn.id) {
        fn.id = Util.i++;
      }

      fn.parsed = tUtil.parse(fn);
    }

    return fn;
  }

  static compute<I,O>(collector:Collector<I, O>):(i:I)=>O {
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
         
    collector.chain
      .reverse()
      .map(t => {
        let tfn = collector.mapping[t.type]; 
        return tfn({node:t.parsed}, state)
      })
      .reverse()
      .forEach(e => {
        body.push(...e.body)
        vars.push(...e.vars);
      }); 

    //Handle collector
    let collect = collector.getCollectAST(state);
    let init = collector.getInitAST(state)

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
    return tUtil.compile(ast as any as AST.FunctionExpression, {}) as any
  }

  static getComputed<I,O>(collector:Collector<I, O>):(i:I)=>O {
    if (collector.key === null) {
      collector.key = collector.chain.map(x => x.id).join('|');
    }
    if (!Util.computed[collector.key]) {
      Util.computed[collector.key] = Util.compute(collector); 
    }
    return Util.computed[collector.key];
  }

  static standardHandler(tr:TransformReference):TransformResponse {
    let params:{[key:string]:AST.Identifier} = {};       
    let pos = m.Id();
    tr.params.push(pos);

    if (tr.node.type === 'ExpressionStatement') {
      tr.node = (tr.node as AST.ExpressionStatement).expression;
    }

    let res = new Visitor({
      FunctionExpression : (node:AST.FunctionExpression) => {
        node.params.forEach((p,i) => params[(p as AST.Identifier).name] = tr.params[i]);
        return node;
      },
      ArrowFunctionExpression : (node:AST.ArrowExpression) => {
        if (node.body.type !== 'BlockStatement') {
          node.body = m.Block(m.Return(node.body))          
        }
        node.params.forEach((p,i) => {
          let name = (p as AST.Identifier).name;
          params[name] = tr.params[i]
        })
        return node;
      },
      ReturnStatement : x => {
        return tr.onReturn(x);
      },
      Identifier : x => {
        return params[x.name] || x;
      }
    }).exec(tr.node) as (AST.FunctionExpression|AST.ArrowExpression);

    let plen = Object.keys(params).length;
    let body = res.body
    let min = tr.params.length - 1;

    return {
      body : plen > min ? [body, m.Expr(m.Increment(pos))] : [body],
      vars : plen > min ? [pos, m.Literal(0)] : []
    }
  }
}