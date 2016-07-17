import { AST } from '../../../../node_modules/@arcsine/ecma-ast-transform/src';

export class VariableStack {
  top = null;
  scope = [null];
  length = 0;

  register(name:string|AST.Identifier) {
    if (this.top === null) {
      this.scope[this.length] = (this.top = {});
    }
    if (typeof name === 'string') {
      this.top[name] = true;
    } else {
      this.top[name.name] = true;
    }
  }

  contains(name:string|AST.Identifier) {
    if (typeof name === 'string') {
      return !!this.top[name];
    } else {
      return !!this.top[name.name];
    }
  }

  push() {
    let out = {};
    for (var k in this.top) {
      out[k] = this.top[k];
    }
    this.length += 1
    this.scope.unshift(this.top = out);
  }

  pop() {
    if (this.scope.length > 0) {
      this.scope.shift()
      this.length -= 1     
      this.top = this.scope[0];
    }
  }
}
