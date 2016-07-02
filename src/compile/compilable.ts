import { Transformable, TransformLevel, TransformUtil } from '../transform';

export class Compilable<I,O>  {
  
  key:string = '~';
  level:TransformLevel = TransformLevel.NO_DEPENDENCE;
  chain:Transformable<any, any>[] = []

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
    let res = TransformUtil.annotateTransformable(toAdd);
    this.chain.push(res);
    this.level = Math.min(this.level, res.level);
    this.key = `${this.key}|${res.id}`;
    return this;
  }
}