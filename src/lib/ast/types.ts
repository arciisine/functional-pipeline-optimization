export interface Node { type: string }
export interface Statement extends Node { }
export interface ASTFunction extends Node { }

export interface EmptyStatement extends Statement {
    type: "EmptyStatement";
}

export interface BlockStatement extends Statement {
    type: "BlockStatement";
    body: Statement[];
}

export interface ExpressionStatement extends Statement {
    type: "ExpressionStatement";
    expression: Expression;
}

export interface IfStatement extends Statement {
    type: "IfStatement";
    test: Expression;
    consequent: Statement;
    alternate?: Statement;
}

export interface LabeledStatement extends Statement {
    type: "LabeledStatement";
    label: Identifier;
    body: Statement;
}

export interface BreakStatement extends Statement {
    type: "BreakStatement";
    label?: Identifier;
}

export interface ContinueStatement extends Statement {
    type: "ContinueStatement";
    label?: Identifier;
}

export interface WithStatement extends Statement {
    type: "WithStatement";
    object: Expression;
    body: Statement;
}

export interface SwitchStatement extends Statement {
    type: "SwitchStatement";
    discriminant: Expression;
    cases: SwitchCase[];
    lexical: boolean;
}

export interface ReturnStatement extends Statement {
    type: "ReturnStatement";
    argument?: Expression;
}

export interface ThrowStatement extends Statement {
    type: "ThrowStatement";
    argument: Expression;
}

export interface TryStatement extends Statement {
    type: "TryStatement";
    block: BlockStatement;
    handler?: CatchClause;
    guardedHandlers?: CatchClause[];
    finalizer?: BlockStatement;
}

export interface WhileStatement extends Statement {
    type: "WhileStatement";
    test: Expression;
    body: Statement;
}

export interface DoWhileStatement extends Statement {
    type: "DoWhileStatement";
    body: Statement;
    test: Expression;
}


export interface ForStatement extends Statement {
    type: "ForStatement";
    init?: VariableDeclaration | Expression ;
    test?: Expression ;
    update?: Expression ;
    body: Statement;
}


export interface ForInStatement extends Statement {
    type: "ForInStatement";
    left: VariableDeclaration |  Expression;
    right: Expression;
    body: Statement;
    each: boolean;
}


export interface ForOfStatement extends Statement {
    type: "ForOfStatement";
    left: VariableDeclaration |  Expression;
    right: Expression;
    body: Statement;
}


export interface LetStatement extends Statement {
    type: "LetStatement";
    head: VariableDeclarator[];
    body: Statement;
}



export interface DebuggerStatement extends Statement {
    type: "DebuggerStatement";
}


export interface Declaration extends Statement { }


export interface FunctionDeclaration extends ASTFunction, Declaration {
    type: "FunctionDeclaration";
    id: Identifier;
    params: Pattern[];
    defaults: Expression[];
    rest?: Identifier ;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}



export interface VariableDeclaration extends Declaration {
    type: "VariableDeclaration";
    declarations: VariableDeclarator[];
    kind: "var" | "let" | "const";
}


export interface VariableDeclarator extends Node {
    type: "VariableDeclarator";
    id: Pattern;
    init?: Expression ;
}

export interface Expression extends Node, Pattern { }


export interface ThisExpression extends Expression {
    type: "ThisExpression";
}


export interface ArrayExpression extends Expression {
    type: "ArrayExpression";
    elements?: Expression[];
}


export interface ObjectExpression extends Expression {
    type: "ObjectExpression";
    properties: Property[];
}


export interface Property extends Node {
    type: "Property";
    key: Literal | Identifier;
    value: Expression;
    kind: "init" | "get" | "set";
}

export interface FunctionExpression extends ASTFunction, Expression {
    type: "FunctionExpression";
    id?: Identifier ;
    params: Pattern[];
    defaults: Expression[];
    rest?: Identifier ;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}

export interface ArrowExpression extends ASTFunction, Expression {
    type: "ArrowExpression";
    params: Pattern[];
    defaults: Expression[];
    rest?: Identifier ;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}

export interface SequenceExpression extends Expression {
    type: "SequenceExpression";
    expressions: Expression[];
}


export interface UnaryExpression extends Expression {
    type: "UnaryExpression";
    operator: UnaryOperator;
    prefix: boolean;
    argument: Expression;
}


export interface BinaryExpression extends Expression {
    type: "BinaryExpression";
    operator: BinaryOperator;
    left: Expression;
    right: Expression;
}


export interface AssignmentExpression extends Expression {
    type: "AssignmentExpression";
    operator: AssignmentOperator;
    left: Pattern;
    right: Expression;
}


export interface UpdateExpression extends Expression {
    type: "UpdateExpression";
    operator: UpdateOperator;
    argument: Expression;
    prefix: boolean;
}


export interface LogicalExpression extends Expression {
    type: "LogicalExpression";
    operator: LogicalOperator;
    left: Expression;
    right: Expression;
}


export interface ConditionalExpression extends Expression {
    type: "ConditionalExpression";
    test: Expression;
    alternate: Expression;
    consequent: Expression;
}


export interface NewExpression extends Expression {
    type: "NewExpression";
    callee: Expression;
    arguments: Expression[];
}


export interface CallExpression extends Expression {
    type: "CallExpression";
    callee: Expression|Identifier;
    arguments: Expression[];
}


export interface MemberExpression extends Expression {
    type: "MemberExpression";
    object: Expression;
    property: Identifier | Expression;
    computed: boolean;
}


export interface YieldExpression extends Expression {
    type: "YieldExpression";
    argument?: Expression ;
}



export interface ComprehensionExpression extends Expression {
    type: "ComprehensionExpression";
    body: Expression;
    blocks: ComprehensionBlock | ComprehensionIf[];
    filter?: Expression ;
}



export interface GeneratorExpression extends Expression {
    type: "GeneratorExpression";
    body: Expression;
    blocks: ComprehensionBlock | ComprehensionIf[];
    filter?: Expression ;
}



export interface GraphExpression extends Expression {
    type: "GraphExpression";
    index: number;
    expression: Literal;
}



export interface GraphIndexExpression extends Expression {
    type: "GraphIndexExpression";
    index: number;
}



export interface LetExpression extends Expression {
    type: "LetExpression";
    head: VariableDeclarator[];
    body: Expression;
}



export interface Pattern extends Node { }

export interface ObjectPattern extends Pattern {
    type: "ObjectPattern";
    properties: { key: Literal | Identifier, value: Pattern }[];
}


export interface ArrayPattern extends Pattern {
    type: "ArrayPattern";
    elements?: Pattern[];
}

export interface SwitchCase extends Node {
    type: "SwitchCase";
    test?: Expression ;
    consequent: Statement[];
}


export interface CatchClause extends Node {
    type: "CatchClause";
    param: Pattern;
    guard?: Expression ;
    body: BlockStatement;
}



export interface ComprehensionBlock extends Node {
    type: "ComprehensionBlock";
    left: Pattern;
    right: Expression;
    each: boolean;
}


export interface ComprehensionIf extends Node {
    type: "ComprehensionIf";
    test: Expression;
}

export interface Identifier extends Expression {
    type: "Identifier";
    name: string;
}


export interface Literal extends Expression {
    type: "Literal";
    value?: string | boolean | number | RegExp;
}


export enum UnaryOperator {
    "-" , "+" , "!" , "~" , "typeof" , "void" , "delete"
}


export enum BinaryOperator {
    "==" , "!=" , "===" , "!=="
        , "<" , "<=" , ">" , ">="
        , "<<" , ">>" , ">>>"
        , "+" , "-" , "*" , "/" , "%"
        , "," , "^" , "&" , "in"
        , "instanceof" , ".."
}



export enum LogicalOperator {
    ",," , "&&"
}


export enum AssignmentOperator {
    "=" , "+=" , "-=" , "*=" , "/=" , "%="
        , "<<=" , ">>=" , ">>>="
        , ",=" , "^=" , "&="
}


export enum UpdateOperator {
    "++" , "--"
}