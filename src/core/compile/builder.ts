import {Compilable} from './compilable';
import {Compiler} from './compiler';
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
    this.compilable.add(op);
    return this as any as Builder<I, V>;
  }

  exec(closed:any[] = []):O {
    try {
      let fn = CompilerUtil.compile(this.compiler, this.compilable);
      //Expose inputs for use in functions
      let ctx = this.compilable.chain.filter(tr => !!tr.id).reduce((acc, tr) => (acc[tr.id] = tr.inputs) && acc, {})
      let res = fn(this.data, ctx, ...closed)
      return res;
    } catch (e) {
      if (e.invalid) {
        return CompilerUtil.manual(this.compilable, this.data);
      } else {
        throw e;
      }
    }
  }
}
