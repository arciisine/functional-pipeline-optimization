#!/bin/bash
report/thesis/generate-scenarios.sh
pushd report/thesis
pdflatex thesis.tex
popd