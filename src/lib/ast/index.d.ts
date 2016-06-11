declare namespace AST {
  interface Node {}
  interface Statement extends Node { }
  interface ASTFunction extends Node { }

  interface EmptyStatement extends Statement {
      type: "EmptyStatement";
  }

  interface BlockStatement extends Statement {
      type: "BlockStatement";
      body: Statement[];
  }

  interface ExpressionStatement extends Statement {
      type: "ExpressionStatement";
      expression: Expression;
  }

  interface IfStatement extends Statement {
      type: "IfStatement";
      test: Expression;
      consequent: Statement;
      alternate?: Statement;
  }

  interface LabeledStatement extends Statement {
      type: "LabeledStatement";
      label: Identifier;
      body: Statement;
  }

  interface BreakStatement extends Statement {
      type: "BreakStatement";
      label?: Identifier;
  }

  interface ContinueStatement extends Statement {
      type: "ContinueStatement";
      label?: Identifier;
  }

  interface WithStatement extends Statement {
      type: "WithStatement";
      object: Expression;
      body: Statement;
  }

  interface SwitchStatement extends Statement {
      type: "SwitchStatement";
      discriminant: Expression;
      cases: SwitchCase[];
      lexical: boolean;
  }

  interface ReturnStatement extends Statement {
      type: "ReturnStatement";
      argument?: Expression;
  }

  interface ThrowStatement extends Statement {
      type: "ThrowStatement";
      argument: Expression;
  }

  interface TryStatement extends Statement {
      type: "TryStatement";
      block: BlockStatement;
      handler?: CatchClause;
      guardedHandlers?: CatchClause[];
      finalizer?: BlockStatement;
  }

  interface WhileStatement extends Statement {
      type: "WhileStatement";
      test: Expression;
      body: Statement;
  }

  interface DoWhileStatement extends Statement {
      type: "DoWhileStatement";
      body: Statement;
      test: Expression;
  }


  interface ForStatement extends Statement {
      type: "ForStatement";
      init?: VariableDeclaration | Expression ;
      test?: Expression ;
      update?: Expression ;
      body: Statement;
  }


  interface ForInStatement extends Statement {
      type: "ForInStatement";
      left: VariableDeclaration |  Expression;
      right: Expression;
      body: Statement;
      each: boolean;
  }


  interface ForOfStatement extends Statement {
      type: "ForOfStatement";
      left: VariableDeclaration |  Expression;
      right: Expression;
      body: Statement;
  }


  interface LetStatement extends Statement {
      type: "LetStatement";
      head: VariableDeclarator[];
      body: Statement;
  }



  interface DebuggerStatement extends Statement {
      type: "DebuggerStatement";
  }


  interface Declaration extends Statement { }


  interface FunctionDeclaration extends ASTFunction, Declaration {
      type: "FunctionDeclaration";
      id: Identifier;
      params: Pattern[];
      defaults: Expression[];
      rest?: Identifier ;
      body: BlockStatement | Expression;
      generator: boolean;
      expression: boolean;
  }



  interface VariableDeclaration extends Declaration {
      type: "VariableDeclaration";
      declarations: VariableDeclarator[];
      kind: "var" | "let" | "const";
  }


  interface VariableDeclarator extends Node {
      type: "VariableDeclarator";
      id: Pattern;
      init?: Expression ;
  }

  interface Expression extends Node, Pattern { }


  interface ThisExpression extends Expression {
      type: "ThisExpression";
  }


  interface ArrayExpression extends Expression {
      type: "ArrayExpression";
      elements?: Expression[];
  }


  interface ObjectExpression extends Expression {
      type: "ObjectExpression";
      properties: Property[];
  }


  interface Property extends Node {
      type: "Property";
      key: Literal | Identifier;
      value: Expression;
      kind: "init" | "get" | "set";
  }

  interface FunctionExpression extends ASTFunction, Expression {
      type: "FunctionExpression";
      id?: Identifier ;
      params: Pattern[];
      defaults: Expression[];
      rest?: Identifier ;
      body: BlockStatement | Expression;
      generator: boolean;
      expression: boolean;
  }

  interface ArrowExpression extends ASTFunction, Expression {
      type: "ArrowExpression";
      params: Pattern[];
      defaults: Expression[];
      rest?: Identifier ;
      body: BlockStatement | Expression;
      generator: boolean;
      expression: boolean;
  }

  interface SequenceExpression extends Expression {
      type: "SequenceExpression";
      expressions: Expression[];
  }


  interface UnaryExpression extends Expression {
      type: "UnaryExpression";
      operator: UnaryOperator;
      prefix: boolean;
      argument: Expression;
  }


  interface BinaryExpression extends Expression {
      type: "BinaryExpression";
      operator: BinaryOperator;
      left: Expression;
      right: Expression;
  }


  interface AssignmentExpression extends Expression {
      type: "AssignmentExpression";
      operator: AssignmentOperator;
      left: Pattern;
      right: Expression;
  }


  interface UpdateExpression extends Expression {
      type: "UpdateExpression";
      operator: UpdateOperator;
      argument: Expression;
      prefix: boolean;
  }


  interface LogicalExpression extends Expression {
      type: "LogicalExpression";
      operator: LogicalOperator;
      left: Expression;
      right: Expression;
  }


  interface ConditionalExpression extends Expression {
      type: "ConditionalExpression";
      test: Expression;
      alternate: Expression;
      consequent: Expression;
  }


  interface NewExpression extends Expression {
      type: "NewExpression";
      callee: Expression;
      arguments: Expression[];
  }


  interface CallExpression extends Expression {
      type: "CallExpression";
      callee: Expression|Identifier;
      arguments: Expression[];
  }


  interface MemberExpression extends Expression {
      type: "MemberExpression";
      object: Expression;
      property: Identifier | Expression;
      computed: boolean;
  }


  interface YieldExpression extends Expression {
      type: "YieldExpression";
      argument?: Expression ;
  }



  interface ComprehensionExpression extends Expression {
      type: "ComprehensionExpression";
      body: Expression;
      blocks: ComprehensionBlock | ComprehensionIf[];
      filter?: Expression ;
  }



  interface GeneratorExpression extends Expression {
      type: "GeneratorExpression";
      body: Expression;
      blocks: ComprehensionBlock | ComprehensionIf[];
      filter?: Expression ;
  }



  interface GraphExpression extends Expression {
      type: "GraphExpression";
      index: number;
      expression: Literal;
  }



  interface GraphIndexExpression extends Expression {
      type: "GraphIndexExpression";
      index: number;
  }



  interface LetExpression extends Expression {
      type: "LetExpression";
      head: VariableDeclarator[];
      body: Expression;
  }



  interface Pattern extends Node { }

  interface ObjectPattern extends Pattern {
      type: "ObjectPattern";
      properties: { key: Literal | Identifier, value: Pattern }[];
  }


  interface ArrayPattern extends Pattern {
      type: "ArrayPattern";
      elements?: Pattern[];
  }

  interface SwitchCase extends Node {
      type: "SwitchCase";
      test?: Expression ;
      consequent: Statement[];
  }


  interface CatchClause extends Node {
      type: "CatchClause";
      param: Pattern;
      guard?: Expression ;
      body: BlockStatement;
  }



  interface ComprehensionBlock extends Node {
      type: "ComprehensionBlock";
      left: Pattern;
      right: Expression;
      each: boolean;
  }


  interface ComprehensionIf extends Node {
      type: "ComprehensionIf";
      test: Expression;
  }

  interface Identifier extends Expression {
      type: "Identifier";
      name: string;
  }


  interface Literal extends Expression {
      type: "Literal";
      value?: string | boolean | number | RegExp;
  }


  enum UnaryOperator {
      "-" , "+" , "!" , "~" , "typeof" , "void" , "delete"
  }


  enum BinaryOperator {
      "==" , "!=" , "===" , "!=="
          , "<" , "<=" , ">" , ">="
          , "<<" , ">>" , ">>>"
          , "+" , "-" , "*" , "/" , "%"
          , "," , "^" , "&" , "in"
          , "instanceof" , ".."
  }



  enum LogicalOperator {
      ",," , "&&"
  }


  enum AssignmentOperator {
      "=" , "+=" , "-=" , "*=" , "/=" , "%="
          , "<<=" , ">>=" , ">>>="
          , ",=" , "^=" , "&="
  }


  enum UpdateOperator {
      "++" , "--"
  }
}