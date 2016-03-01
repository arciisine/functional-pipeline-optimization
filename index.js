"use strict";
    
let typescript = require('typescript');
let test = require('./test');

function rewriteMapReduceFilter() {
     
}

function visitAllExpressions(stmts) {
    if (!Array.isArray(stmts)) {
        stmts = [stmts];
    }
    for (let i = 0; i < stmts.length;i++) {
        if (stmts[0].statements) {
            visitAllExpressions(stmts[0].statements);
        }
    }  
}

let out = test();

let source = typescript.createSourceFile('', test.toString())

let stmt = source.statements[0].body.statements[2].declarationList.declarations[0].initializer

let chain = []
while (stmt) {
    stmt.kind = typescript.SyntaxKind[stmt.kind]
    chain.unshift(stmt)
    stmt = stmt.expression
}

module.exports = {
    source : source,
    chain : chain
}