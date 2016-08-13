import {Compilable} from './compilable';
import {Compiler, ExecOutput, ExecHandler} from './types';
import {CompilerUtil} from './util';
import {Transformable, TransformableConstructor} from '../transform';

export class Builder<I, O> {

  constructor(
    public data:I, 
    public compiler:Compiler<any>, 
    public compilable:Compilable<I,O> = null
  ) {
    if (compilable === null) {
      this.compilable = new Compilable<I,O>();
    }
  }

  chain<V>(op:TransformableConstructor<O, V>, inputs:any):Builder<I, V> {
    this.compilable.add(op, inputs);
    //Expose inputs for use in functions
    return this as any as Builder<I, V>;
  }

  compile():ExecHandler<I,O> {
    return CompilerUtil.compile(this.compiler, this.compilable);
  }

  manual():ExecOutput<O> {
    return { value : CompilerUtil.manual(this.compilable, this.data) }
  }

  exec(closed:any[] = []):ExecOutput<O> {
    try {
      //Ready directly from cache to minimize multiple fn calls
      let fn = CompilerUtil.computed[this.compilable.key] || this.compile();
      return fn({value:this.data, context:this.compilable.pending.map(x => x[1]), closed})
    } catch (e) {
      if (e.invalid) {
        return this.manual();    
      } else {
        throw e;
      }
    }
  }
}
