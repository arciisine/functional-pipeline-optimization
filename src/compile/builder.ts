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

  exec():O {
    return CompilerUtil.compile(this.compiler, this.compilable)(this.data);
  }

  execManual():O {
    return CompilerUtil.manual(this.compilable, this.data);
  }
}
