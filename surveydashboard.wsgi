import os
import sys
import logging

BASE = os.path.dirname(__file__)
sys.path.insert(0, BASE)

activate_this = os.path.join(BASE, 'env/bin/activate_this.py')
execfile(activate_this, dict(__file__=activate_this))
os.environ['PYTHON_EGG_CACHE'] = os.path.join(BASE, '.python-eggs')


from dashboard import app  as application
application.debug = True

