import {Compilable} from './compilable';
import {Compiler, ExecOutput, ExecHandler} from './types';
import {CompilerUtil} from './util';
import {Transformable, TransformableConstructor} from '../transform';

export class Builder<I, O> {

  private keys:string[]

  constructor(
    public data:I, 
    public compiler:Compiler<any>, 
    public compilable:Compilable<I,O>,
    private context:any[][] = [],
    private key:string = null
  ) {
    if (key === null) {
      this.keys = [compilable.constructor.name];
    }
  }

  chain<V>(op:TransformableConstructor<O, V>, inputs:any[], key?:string):Builder<I, V> {
    this.compilable.add(op, inputs);
    this.context.push(inputs);
    !this.key && this.keys.push(key);
    //Expose inputs for use in functions
    return this as any as Builder<I, V>;
  }

  compile():ExecHandler<I,O> {
    return CompilerUtil.compile(this.compiler, this.compilable, this.key);
  }

  manual():ExecOutput<O> {
    return { value : CompilerUtil.manual(this.compilable, this.data) }
  }

  exec(closed:any[] = []):ExecOutput<O> {
    try {
      this.key = this.key || this.keys.join('~');      
      //Ready directly from cache to minimize multiple fn calls
      let fn = CompilerUtil.computed[this.key] || this.compile();
      return fn({value:this.data, context:this.context, closed})
    } catch (e) {
      if (e.invalid) {
        return this.manual();    
      } else {
        throw e;
      }
    }
  }
}
