import { AST, Visitor, Macro as m } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';
import {TransformResponse} from '../../transform';
import {VariableStack} from './stack';
import {VariableVisitHandler, VariableHandler} from './types';

export class VariableVisitorUtil {

  static getPrimaryId(target:AST.Node):AST.Identifier { 
    if (AST.isIdentifier(target)) {
      return target;
    } else {
      while (AST.isMemberExpression(target)) {
        target = target.object;
      }
      if (AST.isIdentifier(target)) {
        return target;
      }
    }
    return null;
  }

  static readDeclarationIds(decls:AST.VariableDeclarator[]):AST.Identifier[] {
    return VariableVisitorUtil.readPatternIds(decls.map(d => d.id));
  }

  static readPatternIds(node:AST.Pattern|AST.Pattern[]):AST.Identifier[] {
    if (Array.isArray(node)) {
      return node
        .map(VariableVisitorUtil.readPatternIds)
        .reduce((acc, ids) => acc.concat(ids), []);
    } else {
      if (AST.isObjectPattern(node)) {
        return VariableVisitorUtil.readPatternIds(node.properties);
      } else if (AST.isArrayPattern(node)) {
        return VariableVisitorUtil.readPatternIds(node.elements);
      } else if (AST.isProperty(node)) {
        //Clone property if shorthand
        if (node.shorthand) {
          node.shorthand = false;
          node.value = {} as any;
          for (var k in node.key) { 
            node.value[k] = node.key[k] 
          }
        }      
        return VariableVisitorUtil.readPatternIds(node.value);      
      } else if (AST.isIdentifier(node)) {
        return [node]
      }
    }
  }

  static findHoistedDeclarationIds(node:AST.Node):AST.Identifier[] {
    let out:AST.Identifier[] = [];

    //Hoist vars, remove nested functions
    new Visitor({
      FunctionDeclaration : (x:AST.FunctionDeclaration) => {
        out.push(x.id);
      },            
      FunctionStart : (x:AST.BaseFunction) => { 
        return Visitor.PREVENT_DESCENT //Only look at current function
      },
      VariableDeclaration : (x:AST.VariableDeclaration) => {
        if (x.kind === 'var') {
          out = out.concat(VariableVisitorUtil.readDeclarationIds(x.declarations));
        }
      }
    }).exec(node);

    return out;
  }

  static getFunctionBlock(x:AST.BaseFunction):AST.BlockStatement {
    if (AST.isFunctionDeclaration(x) || AST.isFunctionExpression(x)) {
      return x.body;
    } else if (AST.isArrowFunctionExpression(x)) {
      if (AST.isBlockStatement(x.body)) {
        return x.body;
      } else {
        let body = m.Block(m.Return(x.body));
        x.expression = false;        
        x.body = body;
        return body;
      }
    }
  }
}