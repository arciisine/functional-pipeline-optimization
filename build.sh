#!/bin/bash
npm update --legacy-bundling
rm -rf dist/
tsc
cp -r node_modules/@arcsine/ecma-ast-transform/node_modules/ dist/node_modules
