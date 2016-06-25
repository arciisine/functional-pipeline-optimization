import {TransformState} from '../transformer';
import {Collector} from './collector';

export class VoidCollector<T, U> extends Collector<T, U> {

  getInitAST(state:TransformState) {
    return null;
  }

  getCollectAST(state:TransformState) {
    return null;
  }
}