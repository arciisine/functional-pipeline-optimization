import { AST } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';

export class VariableStack<T> {
  private variables:{[key:string]:T[]} = {};
  private top:{[key:string]:boolean} = {};
  private stack:{[key:string]:boolean}[] = [this.top];

  register(name:string|AST.Identifier):T {
    let key = typeof name === 'string' ? name : name.name;
    this.top[key] = true;
    this.variables[key] = this.variables[key] || [];

    let res = {} as T
    this.variables[key].push(res)
    return res; 
  }

  get(name:string|AST.Identifier):T {
    let key = typeof name === 'string' ? name : name.name;    
    let s = this.variables[key];
    return s && s.length ? s[s.length-1] : undefined;
  }

  contains(name:string|AST.Identifier) {
    let key = typeof name === 'string' ? name : name.name;
    return this.variables.hasOwnProperty(key);
  }

  push() {
    this.stack.push(this.top = {});
  }

  pop() {
    if (this.stack.length > 1) { //Always leave global
      let toPop = this.stack.pop();
      for (let k of Object.keys(toPop)) {
        this.variables[k].pop();
      }
      this.top = this.stack[this.stack.length-1];
    }
  }
}
