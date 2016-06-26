import {Transformable} from '../transform';

export interface ArrayTransformable<I, O> extends Transformable<I, O> {
  (i:I, ind?:number):O;  
}

export interface ReduceTransformable<I, O> extends Transformable<I, O> {
  (acc:O, i:I, ind?:number, arr?:I[]):O;
}

