import {Compilable} from './compilable';
import {Compiler, ExecOutput, ExecHandler} from './types';
import {CompilerUtil} from './util';
import {Transformable} from '../transform';

export class Builder<I, O> {

  constructor(
    public data:I, 
    public compiler:Compiler<any>, 
    public compilable:Compilable<I,O> = null
  ) {
    if (compilable === null) {
      this.compilable = new Compilable<I,O>();
    }
    this.compilable.key = `${compiler.constructor.name}~` 
  }

  chain<V>(op:Transformable<O, V>):Builder<I, V> {
    this.compilable.add(op);
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
      return this.compile()({value:this.data, context:this.compilable.context, closed})
    } catch (e) {
      if (e.invalid) {
        return this.manual();    
      } else {
        throw e;
      }
    }
  }
}
