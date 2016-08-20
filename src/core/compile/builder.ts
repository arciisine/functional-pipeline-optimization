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

  compile(key:string = null):ExecHandler<I,O> {
    return CompilerUtil.compile(this.compiler, this.compilable, key);
  }

  manual():ExecOutput<O> {
    return { value : CompilerUtil.manual(this.compilable, this.data) }
  }

  exec(closed:any[] = [], key:string = null):ExecOutput<O> {
    //Ready directly from cache to minimize multiple fn calls
    let fn = this.compile(key);
    return fn({value:this.data, context:this.context, closed})
  }
}