import { Util } from '../../node_modules/ecma-ast-transform/src';
import { md5 } from './md5';
import { Transformable } from '../transform';

export class Compilable<I,O>  {

  private static annotated = {};
  private static id:number = 0;

  key:string = '~';
  pure:boolean = true;
  chain:Transformable<any, any>[] = []

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

  constructor(compilable?:Compilable<any, any>, toAdd?:Transformable<any, O>) {
    if (compilable) {
      this.chain = compilable.chain.slice();
      this.pure = compilable.pure;
      this.key = compilable.key;
    }
    if (toAdd) {
      let res = Compilable.annotate(toAdd);
      this.chain.push(res);
      this.pure = this.pure && res.pure;
      this.key = `${this.key}|${res.id}`;
    }
  }
}
