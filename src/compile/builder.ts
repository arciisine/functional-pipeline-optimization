import {Compilable} from './compilable';
import {Compiler} from './compiler';
import {Transformable} from '../transform';

export class Builder<I, O, T extends Compiler<I, O, any>> {
  
  constructor(
    private data:I, 
    private compiler:T, 
    private compilable:Compilable<I,O> = null
  ) {
    if (compilable === null) {
      this.compilable = new Compilable<I,O>();
    }
  }

  chain<V>(op:Transformable<I, V>):this {
    this.compilable.add(op);
    return this as any;
  }

  exec():O {
    return this.compiler.exec(this.compilable, this.data as any);
  }

  execManual():O {
    return this.compiler.execManual(this.compilable, this.data as any);
  }
}
