import sys
import os
import subprocess
import csv
import io
import re
import tempfile
import math

OUTPUT_FOLDER=os.getenv('OUTPUT', 'dist/graphs')
TEST_COMMAND='npm run eval:console'

INPUT = 'n'
ITERS = 'iter'
MEDIAN = 'median'
INPUT_IDX=2
ITER_IDX=3
WAVG_IDX=4
MEDIAN_IDX=5

GNUPLOT_COMMON = """set datafile separator ","
set term postscript eps enhanced color dashed lw 1 'Helvetica' 14
set output '|ps2pdf -dEPSCrop - %(OUTPUT_FOLDER)s/%(name)s.pdf'
plot"""

GNUPLOT_2D_LINES="""set title "{/*1.2 %(test)s}\\n{/*0.8 %(xl)s vs %(yl)s with %(with_stmt)s }"
set xlabel '%(xl)s'
set ylabel '%(yl)s'
set autoscale x
set logscale y 10
set yrange [%(ymin)s:%(ymax)s]
""" 

GNUPLOT_2D_DATA="'%s' using %%(xi)s:%%(yi)s with lines title '%s'"

GNUPLOT_3D_POINTS="""set title "{/*1.2 %(test)s}\\n{/*0.8  %(xl)s vs %(yl)s vs %(zl)s }"
set xlabel '%(xl)s'
set ylabel '%(yl)s'
set autoscale 
"""

GNUPLOT_3D_DATA="'%s' using %(xi)s:%(yi)s:((log($%(zi)s)/log(sqrt(%(medz)s)))/2) with points title '%(zl)s' pt 7 ps var"

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

def plot(name, plot, mix):
  mix['OUTPUT_FOLDER'] = OUTPUT_FOLDER
  fname ='%s/%s.gplot' % (OUTPUT_FOLDER, name)
  with open(fname, 'w') as f:
    f.write(plot % mix)

  run('gnuplot %s -p'% fname, log=False)

def gnuplot_lines(name, rows, headers, xl, yl, xi, yi, with_stmt):
  data_files = generate_data_files(rows, headers)
  data = map(lambda y: y[headers[yi]], rows)
  ymin = min(data)
  ymax = max(data)
  ymin = 10 ** max(0, math.floor(math.log10(ymin)))
  ymax = 10 ** max(1, math.ceil(math.log10(ymax)))
  test = name.split('_')[0]

  plot(name, GNUPLOT_2D_LINES + GNUPLOT_COMMON + (','.join([GNUPLOT_2D_DATA%(f, k)  for k,f in data_files.items()])), locals())

def gnuplot_3d(name, rows, headers, xl, yl, zl, xi, yi, zi):
  data_files = generate_data_files(rows, headers)
  og_name = name
  medz = sum(map(lambda x: x[MEDIAN], rows))/len(rows)
  og_test = name.split('_')[0]

  for k,f in data_files.items():
    name = '%s_%s' %(og_name, k)
    test = '%s %s' %(og_test, k)
    plot(name, GNUPLOT_3D_POINTS + GNUPLOT_COMMON + (GNUPLOT_3D_DATA.replace('%', '%%').replace('%%s', '%s')%f), locals())

def generate_charts(name, *args):
  data = run('%s %s %s'%(TEST_COMMAND, name, ' '.join(args)), log=False)
  (rows, headers) = parseCsvData(data)

  input_sizes = map(lambda a: int(a[INPUT]), rows)
  input_constant = reduce(lambda same, a: same and a == input_sizes[0], input_sizes, True)
  iterations = map(lambda a: int(a[ITERS]), rows)
  iter_constant = reduce(lambda same, a: same and a == iterations[0], iterations, True)

  name = ("%s_%s" % (name, '-'.join(args))).replace(',','+')

  with open('%s/%s.dat'%(OUTPUT_FOLDER,name), 'w') as f:
    f.write(data)

  #iterations is x axis 
  if input_constant:
    gnuplot_lines(
      name, rows, headers, 
      "Iterations", "Time (ns)", 
      ITER_IDX, MEDIAN_IDX, 
      "an Input Size of %s"%input_sizes[0])
  #iterations is y axis
  elif iter_constant:
    gnuplot_lines(
      name, rows, headers, 
      "Input Size", "Time (ns)", 
      INPUT_IDX, MEDIAN_IDX, 
      "%s Iterations"%iterations[0])
  #Build 3d chart
  else:
    gnuplot_3d(name, rows, headers, 
      'Input Size', 'Iterations',  'Time (ns)',  
      INPUT_IDX, ITER_IDX,  MEDIAN_IDX)

if __name__ == '__main__':  
  try:
    os.makedirs(OUTPUT_FOLDER)
  except:
    pass
  generate_charts(*sys.argv[1:])