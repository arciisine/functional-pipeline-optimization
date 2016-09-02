import {ArrayBuilder} from '../array/builder';
import {VariableState} from '../array/types';
import {MAPPING} from '../array/transform';
import {Util, CompilerUtil, ExecOutput, Compilable} from '../../core';

export class Helper {

  static exec<T>(data:T[], key:string, operations:[string, VariableState][], context:any[][], closed:any[], post:(all:any[])=>T):T[] {
    let res = CompilerUtil.computed[key];    
    if (!!res) {
      let ret = res(data, context, closed)
      post && post(ret.assigned);
      return ret.value; 
    } else if (res === null) {
      for (let i = 0; i < operations.length; i++) {
        data = (data[operations[i][0]] as any)(...context[i]);
      }
      return data;
    } else{
      return Helper.interrogate(data, key, operations, context, closed, post)
    }
  }

  static interrogate<T>(data:T[], key:string, operations:[string, VariableState][], context:any[][], closed:any[], post:(all:any[])=>T):T[] {
    if (!Array.isArray(data)) {
      CompilerUtil.computed[key] = null;
    } else {
      let ret:ExecOutput<T[]> = null;
      let builder = new ArrayBuilder<any, T>(data);
      for (let i = 0; i < operations.length; i++) {
        builder.chain(MAPPING[operations[i][0]], context[i]);
      }
      builder.compile(key, {operations})
    }
    //Recurse on invalid states
    return Helper.exec(data, key, operations, context, closed, post);
  }
} 

export let SYMBOL = "_zzx8";
Util.global[`${SYMBOL}_exec`] = Helper.exec