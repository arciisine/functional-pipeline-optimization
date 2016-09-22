import {Compilable} from './compilable';
import {Compiler, ExecOutput, ExecHandler} from './types';
import {CompilerUtil} from './util';
import {Transformable, TransformableConstructor} from '../transform';

export class Builder<I, O> {

  constructor(
    public data:I, 
    public compiler:Compiler<any>, 
    public compilable:Compilable<I,O>,
    private context:any[][] = [],
  ) {}

  chain<V>(op:TransformableConstructor<O, V>, inputs:any[]):Builder<I, V> {
    this.compilable.add(op, inputs);
    this.context.push(inputs);
    //Expose inputs for use in functions
    return this as any as Builder<I, V>;
  }

  compile(key?:string, extraState?:any):ExecHandler<I,O> {
    try {
      return CompilerUtil.compile(this.compiler, this.compilable, key, extraState);
    } catch (e) {
      if (e.invalid && key) {
        CompilerUtil.computed[key] = null;
        throw new Error("Function is not compilable");        
      } else {
        console.log(e);
        throw e;
      }
    } 
  }

  manual():ExecOutput<O> {
    return { value : CompilerUtil.manual(this.compilable, this.data) }
  }

  exec(closed:any[] = [], key?:string):ExecOutput<O> {
    //Ready directly from cache to minimize multiple fn calls
    let fn = this.compile(key);
    return fn(this.data, this.context, closed)
  }
}