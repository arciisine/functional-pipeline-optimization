import {ArrayBuilder} from './builder';
import {Builder} from '../../core';

export function exec<T>(r:Builder<T[], any>|T):T[]|T {
  return r instanceof Builder ? r.exec() : r
}

export function wrap<T>(el:T[]):T[] {
  return Array.isArray(el) ? new ArrayBuilder<T,T>(el) as any as T[]: el;
}