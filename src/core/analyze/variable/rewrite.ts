import { AST, Macro as m, ParseUtil, Visitor } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import { TransformResponse} from '../../transform';
import { VariableNodeHandler } from './handler' 
import { VariableStack } from './stack'; 
import { VariableVisitorUtil }  from './util'

export interface RewriteContext {
  rewriteName:string;
} 

export class RewriteUtil {
  static rewriteVariables(stack:VariableStack<RewriteContext>, fn:AST.BaseFunction, params:AST.Identifier[]):TransformResponse {
    //Handle wether or not we can reference the element, or if we
    //  we need to assign to leverage pattern usage
    let fnparams = fn.params;
    let assign = {};

    let body = [];

    for (let i = 0; i < fn.params.length;i++) {
      let p = fn.params[i];
      if (AST.isArrayPattern(p) || AST.isObjectPattern(p)) {        
        body.unshift(m.Vars(p, params[i]))
        VariableVisitorUtil.readPatternIds(p).forEach(id => {
          let data = stack.register(id);
          id.name = data.rewriteName = m.Id(id.name+'_', true).name
        })
      } else if (AST.isIdentifier(p)) {
        let data = stack.register(p);
        p.name = data.rewriteName = (params[i] as AST.Identifier).name;         
      }
    }

    let depth = 0;

    //Rename all variables to unique values
    let handler = new VariableNodeHandler({
      Function : () => depth++,
      FunctionEnd : () => depth--,
      Declare:(name:AST.Identifier, parent:AST.Node) => {
        //TODO: Find better way of not rewriting special functions        
        if (depth < 1) {          
          //Skip parents
        } else {
          //Don't declare variables in nested functions
          if (depth > 1 && stack.contains(name)) {
            stack.get(name).rewriteName = name.name;
          } else {           
            let id = m.Id(name.name+'_', true);
            stack.register(name);
            stack.get(name).rewriteName = id.name;
            name.name = id.name;
          }
        }
      },
      Access:(name:AST.Identifier, parent:AST.Node) => {
        if (stack.contains(name)) {
          name.name = stack.get(name).rewriteName; //Rewrite
        }
      }
    }, stack);

    Visitor.exec(handler, fn);

    return {
      body,
      vars : []
    } 
  }
}