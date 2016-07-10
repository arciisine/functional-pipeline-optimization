import {ArrayBuilder} from './builder';
import {Builder} from '../../core';

declare var process;
if (process) {
  [process.stdout, process.stderr].forEach((s) => {
    s && s.isTTY && s._handle && s._handle.setBlocking &&
      s._handle.setBlocking(true)
  })
}



/**
 * Not using minimal form to allow for parse to provide necessary structure
 */
export const Helper = {
  first : function a<T>(args:any[]) { return args[0] },
  local : function a<T>(el:T):T { return ((el as any).local = true) && el; },
  wrap : function a<T>(el:T):T { return ((el as any).wrap ? (el as any).wrap() : el) as T; },
  exec : function a<T>(el:T, closed:any[]=[]):T { return (el as any).exec ? (el as any).exec(closed) as T : el; }
} 

 Array.prototype['wrap'] = function() {
   return new ArrayBuilder<any,any>(this as any)
 }