#!/bin/bash
npm update --legacy-bundling
rm -rf dist/
tsc
cp -r node_modules/ecma-ast-transform/node_modules/ dist/node_modules
