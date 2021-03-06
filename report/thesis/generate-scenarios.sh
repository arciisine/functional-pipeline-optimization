#!/bin/bash
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCENARIO_PATH="pages/results/scenarios"
GRAPHS="graphs"
SCENARIO_ROOT="$ROOT/$SCENARIO_PATH"
GRAPH_ROOT="$SCENARIO_ROOT/$GRAPHS"
TEMP_ROOT="dist/$GRAPHS"

SIZES="1..100000..5000x2 2x1..100000..5000  1..100000..5000x10 10x1..100000..5000 100x1..100000..5000 1..100000..5000x100"
SCENARIOS="md5 sort-score-sum std-dev text-analysis"

function generate-scenario() {
  TEX=$1
  NAME=$2
  SIZE=$3
  TEMP_KEY="${NAME}_${SIZE}"
  GRAPH_KEY=`echo $TEMP_KEY | sed -e 's|\.\.|__|g'`

  if [[ ! -e "$GRAPH_ROOT/$GRAPH_KEY.pdf" || -n "$FORCE" ]]; then
    npm -s run eval:gnuplot impl.evaluate.loader $NAME $SIZE
  fi

  cp $TEMP_ROOT/$TEMP_KEY.{dat,gplot} $GRAPH_ROOT/
  cp $TEMP_ROOT/$TEMP_KEY.pdf $GRAPH_ROOT/$GRAPH_KEY.pdf

  TITLE=`cat $GRAPH_ROOT/$TEMP_KEY.gplot | grep TITLE | awk -F '#TITLE: ' '{print $2 }'`  
  TITLE=`echo $TITLE | sed -e 's/md5/\\\\mdfive/g'`

  echo '\noindent\begin{figure}[H]' >> $TEX
  echo "\caption{$TITLE}" >> $TEX
  echo "\includegraphics[scale=1.15]{$SCENARIO_PATH/$GRAPHS/$GRAPH_KEY.pdf}" >> $TEX
  echo '\label{fig:'${NAME}:${SIZE}'}' >> $TEX
  echo "\end{figure}" >> $TEX
}

function generate-all-scenarios() {
  INDEX_TEX=$SCENARIO_ROOT/index.tex
  rm $SCENARIO_ROOT/*.graphs.tex
  rm $INDEX_TEX

  echo '\section{Scenarios}' > $INDEX_TEX
  mkdir -p $SCENARIO_ROOT/$GRAPHS 
  
  for NAME in $SCENARIOS; do
    SCENARIO_TEX=$SCENARIO_ROOT/$NAME.graphs.tex
    for SIZE in $SIZES; do
      echo "GENERATING: $NAME $SIZE"
      generate-scenario $SCENARIO_TEX $NAME $SIZE
    done
    echo '\input{'$SCENARIO_PATH/$NAME.tex'}' >> $INDEX_TEX
    echo '\newpage' >> $INDEX_TEX  
    echo '\input{'$SCENARIO_PATH/$NAME.graphs.tex'}' >> $INDEX_TEX
    echo '\clearpage' >> $INDEX_TEX
  done
}

generate-all-scenarios