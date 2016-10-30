#!/bin/bash
report/thesis/generate-scenarios.sh
pushd report/thesis
rm thesis.{b,l,a,n,o,x,to}*
pdflatex thesis
biber thesis
pdflatex thesis
popd