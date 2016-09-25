#!/bin/bash
report/thesis/generate-scenarios.sh
pushd report/thesis
pdflatex thesis
biber thesis
pdflatex thesis
popd