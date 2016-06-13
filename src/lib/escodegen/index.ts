import * as AST from '../ast/types';
import escodegen from './lib';
export let generate:(node:AST.Node)=>string = escodegen['generate']