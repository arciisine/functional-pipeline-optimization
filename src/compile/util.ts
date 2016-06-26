import {AST, Util, Macro as m} from '../../node_modules/ecma-ast-transform/src';
import {md5} from './md5';
import {Transformable, Transformer, TransformState} from '../transform';
import {Compilable } from './types';

export class CompileUtil {
  private static id = 0;
  private static computed:{[key:string]:(...args:any[])=>any} = {};
  private static annotated:{[key:string]:Transformable<any, any>} = {};

  static tag<I,O>(fn:(...args:any[])=>any, config:any) {
    return {
      raw  : fn,
      globals : config.globals,
      manual : config.manual,
      transformer : config.transformer
    };
  }

  static annotate<I, O>(fn:Transformable<I,O>):Transformable<I,O> {
    if (fn.pure === undefined) {
      fn.pure = Util.isPureFunction(fn.raw, fn.globals || {});
    } 

    if (fn.pure) {
      if (!fn.key) {
        fn.key = md5(fn.raw.toString());
      }

      if (CompileUtil.annotated[fn.key]) {
        fn = CompileUtil.annotated[fn.key];
      } else {
        CompileUtil.annotated[fn.key] = fn;
      }

      if (!fn.id) {
        fn.id = CompileUtil.id++;
      }
    }

    return fn;
  }

  static compile<I,O>(collector:Compilable<I, O>):(i:I)=>O {
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
        return t.transformer({node:Util.parse(t.raw)}, state)
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
    return Util.compile(ast as any as AST.FunctionExpression, {}) as any
  }

  static getCompiled<I,O>(collector:Compilable<I, O>):(i:I)=>O {
    if (collector.key === null) {
      collector.key = collector.chain.map(x => x.id).join('|');
    }
    if (!CompileUtil.computed[collector.key]) {
      CompileUtil.computed[collector.key] = CompileUtil.compile(collector); 
    }
    return CompileUtil.computed[collector.key];
  }
}