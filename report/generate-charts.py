import sys
import os
import subprocess
import csv
import io
import re
import tempfile

OUTPUT_FOLDER='report/thesis/graphs'
TEST_COMMAND='node --stack-trace-limit=1000 dist/src/test/test.js'

INPUT = 'n'
ITERS = 'iter'
INPUT_IDX=2
ITER_IDX=3
WAVG_IDX=4
MEDIAN_IDX=5

GNUPLOT_TPL = \
"""set title "%(title)s"
set xlabel '%(xlabel)s'
set ylabel '%(ylabel)s'
set autoscale
unset autoscale y
set logscale y 10
set yrange [100:10000000] 
set datafile separator ","
set term postscript eps enhanced color dashed lw 1 'Helvetica' 14
set output '|ps2pdf -dEPSCrop - %(name)s'
plot  %(data)s
"""

def run(exe, log=True, throwError=True):
  if isinstance(exe, list):
    exe = ' '.join(exe)
  p = subprocess.Popen(exe, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True)
  res = p.stdout
  if log:
    for x in iter(res.readline, ''):
      print x,
  else:
    res = res.read()

  if throwError:
    exit_code = p.wait()
    if exit_code != 0:
      raise Exception("Failed: %s %d" % (exe, exit_code))
  return unicode(res)

def parseCsvData(output):
  rows = csv.DictReader(io.StringIO(output), delimiter="|")
  data = []
  for row in rows:
    item = {}
    for (k,v) in row.items():
      k = k.strip()
      v = v.strip()
      try:
        item[k] = float(v)
      except:
        item[k] = v
    data.append(item)
  return (data, map(lambda x: x.strip(), rows.fieldnames))

def group_by(rows, key):
  out = {}
  for r in rows:
    k = r[key]
    if k not in out:
      out[k] = []
    out[k].append(r)
  return out

def generate_data_files(rows, keys):
  data = group_by(rows, 'test')
  data_files = {}
  for k in data.keys():
    f = tempfile.NamedTemporaryFile(delete=False)
    csv.DictWriter(f, keys).writerows(data[k])
    data_files[k] = f.name
  return data_files

def generate_charts(name, *args):
  data = run('%s %s %s'%(TEST_COMMAND, name, ' '.join(args)), log=False)
  (rows, headers) = parseCsvData(data)

  input_sizes = map(lambda a: a[INPUT], rows)
  input_constant = reduce(lambda same, a: same and a == input_sizes[0], input_sizes, True)
  iterations = map(lambda a: a[ITERS], rows)
  iter_constant = reduce(lambda same, a: same and a == iterations[0], iterations, True)

  plot = ''
  name = ("%s_%s" % (name, '-'.join(args))).replace(',','+')

  with open('%s/%s.dat'%(OUTPUT_FOLDER,name), 'w') as f:
    f.write(data)

  #iterations is x axis 
  if input_constant:
    data_files = generate_data_files(rows, headers)
    plot = GNUPLOT_TPL % {
      "name"   : '%s/%s.pdf'%(OUTPUT_FOLDER,name),
      "title"  : "Time vs Iterations with an Input Size of %s" % input_sizes[0],
      "xlabel" : "Iterations",
      "ylabel" : "Time",
      "data"   : ','.join([ "'%s' using %s:%s with lines title '%s'"%(data_files[k], ITER_IDX, MEDIAN_IDX, k)  for k in data_files.keys()])
    }
  #iterations is y axis
  elif iter_constant:
    data_files = generate_data_files(rows, headers)
    plot = GNUPLOT_TPL % {
      "name"   : '%s/%s.pdf'%(OUTPUT_FOLDER,name),
      "title"  : "Time vs Input Sizes with %s Iterations" % iterations[0],
      "xlabel" : "Input Size",
      "ylabel" : "Time",
      "data"   : ','.join([ "'%s' using %s:%s with lines title '%s'"%(data_files[k], INPUT_IDX, MEDIAN_IDX, k)  for k in data_files.keys()])
    }
  #Build 3d chart
  else:
    pass
  
  if plot:
    f = tempfile.NamedTemporaryFile(delete=False)
    with f:
      f.write(plot)
    run('gnuplot %s -p'% f.name, log=False)
    os.unlink(f.name)

if __name__ == '__main__':
  generate_charts(*sys.argv[1:])