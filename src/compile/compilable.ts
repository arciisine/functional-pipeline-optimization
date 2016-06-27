import { Util } from '../../node_modules/ecma-ast-transform/src';
import { md5 } from './md5';
import { Transformable } from '../transform';

export class Compilable<I,O>  {

  private static annotated = {};
  private static id:number = 0;

  key:string = null
  pure:boolean = true;
  chain:Transformable<any, any>[]

  static annotate<I, O>(fn:Transformable<I,O>):Transformable<I,O> {
    if (fn.pure === undefined) {
      fn.pure = Util.isPureFunction(fn.raw, fn.globals || {});
    } 

    if (fn.pure) {
      if (!fn.key) {
        fn.key = md5(fn.raw.toString());
      }

      if (Compilable.annotated[fn.key]) {
        fn = Compilable.annotated[fn.key];
      } else {
        Compilable.annotated[fn.key] = fn;
      }

      if (!fn.id) {
        fn.id = Compilable.id++;
      }
    }

    return fn;
  }

  constructor(toAdd:Transformable<any, O>, compilable?:Compilable<I, O>) {
    let res = Compilable.annotate(toAdd);
      
    if (compilable) {
      this.chain = compilable.chain.slice();
      this.pure = compilable.pure && res.pure;
      this.key = `${compilable.key}|${res.id}`;
    } else {
      this.chain = [res];
      this.pure = res.pure;
      this.key = `${res.id}`;
    }
  }
}
