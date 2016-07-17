import {Compilable} from './compilable';
import {Compiler, ExecOutput} from './types';
import {CompilerUtil} from './util';
import {Transformable} from '../transform';

export class Builder<I, O> {
  
  constructor(
    private data:I, 
    private compiler:Compiler<any>, 
    private compilable:Compilable<I,O> = null
  ) {
    if (compilable === null) {
      this.compilable = new Compilable<I,O>();
    }
  }

  chain<V>(op:Transformable<O, V>):Builder<I, V> {
    op.position = this.compilable.chain.length;
    this.compilable.add(op);
    return this as any as Builder<I, V>;
  }

  exec(closed:any[] = []):ExecOutput<O> {
    try {
      let fn = CompilerUtil.compile(this.compiler, this.compilable);
      //Expose inputs for use in functions
      let context = this.compilable.chain.map(tr => tr.inputs)
      return fn({value:this.data, context, closed})
    } catch (e) {
      if (e.invalid) {
        return { value : CompilerUtil.manual(this.compilable, this.data) }
      } else {
        throw e;
      }
    }
  }
}
