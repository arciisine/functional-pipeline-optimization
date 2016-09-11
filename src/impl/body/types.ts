import {AST, Macro as m } from '../../../node_modules/@arcsine/ecma-ast-transform/src';

export const OPTIMIZE_ON = "use optimize";
export const OPTIMIZE_OFF = "disable optimize";

export const SYMBOL = "_zzx8";
export const EXEC = m.Id(`${SYMBOL}_exec`);

export const CANDIDATE = m.genSymbol();
export const CANDIDATE_KEY = m.genSymbol();
export const CANDIDATE_START = m.genSymbol();
export const CANDIDATE_FUNCTIONS = m.genSymbol();
export const CANDIDATE_RELATED = m.genSymbol();
export const ANALYSIS = m.genSymbol();

export interface OptimizeState {
  active:boolean,
  globals?:string[],
  flags?:{}
}