import {Compilable} from './compilable';
import {Compiler} from './compiler';
import {Transformable} from '../transform';

export class Builder<I, O> {
  
  constructor(
    private data:I, 
    private compiler:Compiler<I, O, any>, 
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
    return this.compiler.exec(this.compilable, this.data as any);
  }

  execManual():O {
    return this.compiler.execManual(this.compilable, this.data as any);
  }
}
