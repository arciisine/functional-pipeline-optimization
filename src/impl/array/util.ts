import {ArrayBuilder} from './builder';
import {Builder} from '../../core';

export function exec<T>(r:Builder<T[], any>|T, closed:any[] = [], consts:any[] = []):T[]|T {
  return r instanceof Builder ? r.exec() : r
}

export function last(args:any[]) {
  return args[args.length - 1];
}

export function wrap<T>(el:T[]):T[] {
  return Array.isArray(el) ? new ArrayBuilder<T,T>(el) as any as T[]: el;
}