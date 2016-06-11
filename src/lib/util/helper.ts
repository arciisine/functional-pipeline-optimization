import * as AST from "../ast"
import {genSymbol} from './index';

export let Id = (name?:string):AST.Identifier => {return {type:"Identifier", name:name||genSymbol()}}
export let Literal = (value:any):AST.Literal =>  {return {type:"Literal",    value }};
export let Block = (...body):AST.BlockStatement => {return {type:"BlockStatement", body:body.filter(x => !!x) }};
export let Expr = (n:AST.Node):AST.Expression => {return {type:"Expression", expression:n}};
export let Return = (e:AST.Expression):AST.ReturnStatement => {return {type:"ReturnStatement", argument:e}};
export let Yield = (e:AST.Expression, delegate:boolean = false):AST.YieldExpression => {
  return {type:"YieldExpression", argument:e, delegate} as AST.YieldExpression
};
export let Throw = (e:AST.Expression):AST.ThrowStatement => {return {type:"ThrowStatement", argument:e}};
export let Call = (id:AST.Identifier, ...args):AST.CallExpression => {
  return {type:"CallExpression", callee:id, arguments:args.filter(x => !!x)}
}

export let GetProperty = (id:AST.Identifier, prop:string):AST.MemberExpression => {
  return {
    type : "MemberExpression",
    computed : false,
    object : id,
    property : Literal(prop),
  };
}
export let Vars = (...args):AST.VariableDeclaration => {
  let decls = [];
  for (let i = 0; i < args.length; i+=2) {
    if (args[i] && args[i+1]) {
      decls.push({type:"VariableDeclarator", id:args[i], init:args[i+1]});
    }
  }
  return {type:"VariableDeclaration",kind:"var", declarations: decls};
}

export let BinaryExpr = (id:AST.Identifier, op:string, val:AST.Expression):AST.BinaryExpression => {
  return {
    type : "BinaryExpression",
    left : id,
    operator : op as any as AST.BinaryOperator,
    right : val
  }
}

export let Increment = (id:AST.Identifier, increment:number = 1):AST.AssignmentExpression => {
  return {
    type : "AssignmentExpression",
    left : id,
    operator : '+=' as any as AST.AssignmentOperator,
    right : Literal(increment)
  };
}

export let ForLoop = (id:AST.Identifier, init:AST.Expression, upto:AST.Expression, body:AST.Statement, increment:number = 1):AST.ForStatement => {
  return {
    type : "ForStatement",
    init: Vars(id, init),
    test: BinaryExpr(id, '<', upto),
    update: Increment(id, increment),
    body: Block(body)
  };
}

export let TryCatchFinally = (t:AST.Node[], c:AST.Node[] = [], f:AST.Node[] = []):AST.TryStatement => {
  return {
    type : "TryStatement",
    block :  Block(...t),
    handler : {
      type: "CatchClause",
      param : Id('e'),
      body : Block(...c),
    },
    finalizer : Block(...f)
  };
}
export let Func = (id:AST.Identifier, params:AST.Pattern[], body:AST.Node[], generator:boolean = false):AST.FunctionDeclaration => {
  return {
    type : "FunctionDeclaration", 
    id,
    params, 
    body : Block(...body), 
    generator, 
    defaults:[], 
    expression:false
  };
} 
export let IfThen = (test:AST.Expression, body:AST.Node[], elseBody:AST.Node[] = []):AST.IfStatement => {
  let res:any = {
    type : "IfStatement",
    test,
    consequent : Block(...body)
  }
  if (elseBody) {
    res['alternate']  = Block(...elseBody)
  };
  return res as AST.IfStatement;
} 