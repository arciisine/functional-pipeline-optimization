import {Analyzable, Analysis, FunctionAnalyzer} from '../analyze';
import {Transformable} from './types';

export class TransformUtil {  
  static analyze<I, O, T extends Transformable<I,O>>(el:T):T {
    el.analysis = new Analysis("~");
    el.callbacks.forEach(x => x.analysis = FunctionAnalyzer.analyze(x))
    el.callbacks.reduce((acc, x) => acc.analysis.merge(x) && acc, el);
    return el;
  }
}