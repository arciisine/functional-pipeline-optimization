import { Util } from '../../node_modules/@arcsine/ecma-ast-transform/src';
import { md5 } from './md5';
import { Transformable, TransformLevel } from '../transform';

export class Compilable<I,O>  {

  private static annotated = {};
  private static id:number = 0;

  key:string = '~';
  level:TransformLevel = null;
  chain:Transformable<any, any>[] = []

  static annotate<I, O>(fn:Transformable<I,O>):Transformable<I,O> {
    if (fn.level === null) {
      if (Util.isPureFunction(fn.raw, fn.globals || {})) {
        fn.level = TransformLevel.NO_DEPDENDENCE
      }
    } 

    if (fn.level >= TransformLevel.READ_DEPENDENCE) {
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
      this.level = compilable.level;
      this.key = compilable.key;
    }
    if (toAdd) {
      this.add(toAdd);
    }
  }

  add(toAdd?:Transformable<any, any>):this {
    let res = Compilable.annotate(toAdd);
    this.chain.push(res);
    this.level = Math.min(this.level, res.level);
    this.key = `${this.key}|${res.id}`;
    return this;
  }
}
