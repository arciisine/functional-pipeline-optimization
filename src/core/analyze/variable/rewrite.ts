import { AST, Macro as m, ParseUtil, Visitor } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformResponse} from '../../transform';
import { VariableNodeHandler } from './handler' 
import { VariableStack } from './stack'; 
import { VariableVisitorUtil }  from './util'

export interface RewriteContext {
  rewriteName:string;
} 

export class RewriteUtil {

  static SIMPLE_VAR_NAMES = 'abcdefghijklmnopqrstuvwyxz'.split('');

  static rewriteSimple(fn:AST.BaseFunction, params:AST.Identifier[]) {
    const len = RewriteUtil.SIMPLE_VAR_NAMES.length;
    let state = [-1,-1,-1,-1,-1,-1,-1,-1];
    let getId = (orig:string) => {
      if (state[0] < len) state[0] += 1;
      let pos = 0;
      while (state[pos] >= len) {
        state[pos++] = 0;
        state[pos] = state[pos]++;
      } 
      return AST.Identifier({
        name: state
          .filter(x => x > 0)
          .map(x => RewriteUtil.SIMPLE_VAR_NAMES[x])
          .join('')
      });
    };
    //Handles globals that may overlap
    RewriteUtil.rewriteVariables(new VariableStack<RewriteContext>(), fn, params);
    RewriteUtil.rewriteVariables(new VariableStack<RewriteContext>(), fn, params, getId);
    
    return fn;
  }

  static rewriteVariables(stack:VariableStack<RewriteContext>, fn:AST.BaseFunction, params:AST.Identifier[], getId?:(orig?:string)=>AST.Identifier):TransformResponse {
    let assign = {};

    let body:AST.Expression[] = [];
    let localGetId = getId ? getId : orig => m.Id(orig+'_', true);
    
    for (let i = 0; i < fn.params.length;i++) {
      let p = fn.params[i];
      if (AST.isArrayPattern(p) || AST.isObjectPattern(p)) {        
        body.unshift(m.Vars(p, params[i]))
        VariableVisitorUtil.readPatternIds(p).forEach(id => {
          let data = stack.register(id);
          id.name = data.rewriteName = localGetId(id.name).name
        })
      } else if (AST.isIdentifier(p)) {
        let n = p.name;
        let data = stack.register(p);
        p.name = data.rewriteName = params[i].name;
      }
    }

    let active = false;
    let mainFunction = false;

    //Rename all variables to unique values
    let handler = new VariableNodeHandler({
      Function : node => {
        mainFunction = node === fn;
        active = active || mainFunction;
      },
      FunctionEnd : node => {
        active = active && node !== fn;
        mainFunction = mainFunction && active;         
      },
      Declare:(name:AST.Identifier, parent:AST.Node) => {
        if (!active) return;

        //Force name to be original if not in mainFunction
        if (!mainFunction && stack.contains(name)) {
          stack.get(name)!.rewriteName = name.name;
        } else {
          //Rename variables in top level fn
          let id = localGetId(name.name);
          stack.register(name);
          stack.get(name)!.rewriteName = id.name;
          name.name = id.name;
        }
      },
      Access:(name:AST.Identifier, parent:AST.Node) => {
        if (stack.contains(name)) {
          name.name = stack.get(name)!.rewriteName; //Rewrite
        }
      }
    }, stack);

    Visitor.exec(handler, fn);

    return {
      body,
      vars : [],
      after : []
    } 
  }
}