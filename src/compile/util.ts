import {AST, Util as tUtil, Macro as m} from '../../node_modules/ecma-ast-transform/src';
import {md5} from './md5';
import {Transformable, Transformer, TransformState} from '../transform';
import {Compilable} from './types';

export class CompileUtil {
  private static i = 0;
  private static computed:{[key:string]:Transformable} = {};
  private static annotated:{[key:string]:Transformable} = {};

  static tag(fn:Transformable, transformer:Transformer, name?:string, globals?:any) {
    fn.globals = globals;
    fn.transformer = transformer;
    fn.type = name || transformer.name;
  }

  static annotate(fn:Transformable):Transformable {
    if (fn.pure === undefined) {
      fn.pure = tUtil.isPureFunction(fn, fn.globals || {});
    } 

    if (fn.pure) {
      if (!fn.key) {
        fn.key = md5(fn.toString());
      }

      if (CompileUtil.annotated[fn.key]) {
        fn = CompileUtil.annotated[fn.key];
      } else {
        CompileUtil.annotated[fn.key] = fn;
      }

      if (!fn.id) {
        fn.id = CompileUtil.i++;
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
        return t.transformer({node:tUtil.parse(t)}, state)
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