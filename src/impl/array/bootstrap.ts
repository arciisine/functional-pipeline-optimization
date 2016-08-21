import {ArrayBuilder} from './builder';
import {MAPPING} from './transform';
import {Util, CompilerUtil, ExecOutput, Compilable} from '../../core';
import {md5} from './md5';

const is_arr = Array.isArray;

export class Helper {
  static key<T>(el:T, key?:string):string {
    if (key) {
      return key;
    } else if (typeof el === 'function') {
      let fn = el as any 
      fn.key = fn.key || md5(el.toString());
      return fn.key;
    } else {
      return ''+el;
    } 
  }
  static exec<T>(data:T[], key:string, operations:string[], context:any[][], closed:any[]=[], post:(all:any[])=>T = null ):T[] {
    let res = CompilerUtil.computed[key];
    if (is_arr(data) && res !== null) {
      let ret:ExecOutput<T[]> = null;
      
      if (res) {
        ret = res({value:data, closed, context })
      } else {
        let builder = new ArrayBuilder<any, T>(data);
        for (let i = 0; i < operations.length; i++) {
          builder.chain(MAPPING[operations[i]], context[i]);
        }
        try {
          ret = builder.exec(closed, key)
        } catch (e) {
          if (e.invalid) {
            CompilerUtil.computed[key] = null;
            ret = builder.manual();
          } else {
            throw e;
          }
        } 
      }
      if (post !== null) post(ret.assigned);
      return ret.value as T[];
    } else {
      for (let i = 0; i < operations.length; i++) {
        data = (data[operations[i]] as any)(...context[i]);
      }
      return data;
    }
  }
} 

export let SYMBOL = "_zzx8";
Util.global[`${SYMBOL}`] = Helper
Util.global[`${SYMBOL}_key`]  = Helper.key
Util.global[`${SYMBOL}_exec`] = Helper.exec