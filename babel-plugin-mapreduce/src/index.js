"use strict";
var util = require('util');

module.exports = function (conf) {
  var found = null
  return {
    visitor: {
      Identifier(node, parent) {          
          if (!found) {
              console.log(node.name);
              console.log(util.inspect(node, { depth: 1 }));
              found = node;
          }
      }
    }
  };
};