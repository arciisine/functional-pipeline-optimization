import {Compilable} from './compilable';
import {Compiler, ExecOutput, ExecHandler} from './types';
import {CompilerUtil} from './util';
import {Transformable} from '../transform';

export class Builder<I, O> {

  context:any[] = []
  key:string;

  constructor(
    public data:I, 
    public compiler:Compiler<any>, 
    public compilable:Compilable<I,O> = null
  ) {
    if (compilable === null) {
      this.compilable = new Compilable<I,O>();
    }
    this.key = `${compiler.constructor.name}~` 
  }

  chain<V>(op:Transformable<O, V>):Builder<I, V> {
    op.position = this.compilable.chain.length;
    this.compilable.add(op);
    //Expose inputs for use in functions
    this.context.push(op.inputs);
    this.key += op.analysis.key  + "~";
    return this as any as Builder<I, V>;
  }

  compile():ExecHandler<I,O> {
    return CompilerUtil.compile(this.compiler, this.compilable, this.key);
  }

  exec(closed:any[] = []):ExecOutput<O> {
    try {
      return this.compile()({value:this.data, context:this.context, closed})
    } catch (e) {
      if (e.invalid) {
        return { value : CompilerUtil.manual(this.compilable, this.data) }
      } else {
        throw e;
      }
    }
  }
}
