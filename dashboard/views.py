# Copyright (C) 2016 Baofeng Dong
# This program is released under the "MIT License".
# Please see the file COPYING in the source
# distribution of this software for license terms.


import os
import sys
import time
import json
from decimal import Decimal

from flask import make_response, Blueprint, redirect
from flask import url_for,render_template, jsonify, request
from sqlalchemy import func

from .helper import Helper
from dashboard import debug, error
from dashboard import Session as Session
from dashboard import app


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/introduction')
def intro():
    return render_template("introduction.html")

@app.route('/map')
def map():
    routes = [ route['rte_desc'] for route in Helper.get_routes() ]
    directions = Helper.get_directions()

    return render_template("map.html",
        routes=routes,directions=directions)


@app.route('/map/_query', methods=['GET'])
def map_query():
    response = []
    rte_desc = ""
    dir_desc = ""


    if 'rte_desc' in request.args.keys():
        rte_desc = request.args['rte_desc'].strip()
        debug(rte_desc)
    if 'dir_desc' in request.args.keys():
        dir_desc = request.args['dir_desc'].strip()
        debug(dir_desc)
    response = Helper.query_map_data(rte_desc=rte_desc,
        dir_desc=dir_desc)

    return jsonify(data=response)


@app.route('/data')
def data():
    """Sets up table headers and dropdowns in template"""
    headers = ['Date', 'Time', 'Surveyor', 'Route', 'Direction', 'Satisfaction', 'Comments']
    routes = [ route['rte_desc'] for route in Helper.get_routes() ]
    directions = Helper.get_directions()
    users = Helper.get_users()

    return render_template('data.html',
            routes=routes, directions=directions, headers=headers,
            users=users)


@app.route('/data/_query', methods=['GET'])
def data_query():
    response = []
    user = ""
    rte_desc = ""
    dir_desc = ""
    csv = False

    if 'rte_desc' in request.args.keys():
        rte_desc = request.args['rte_desc'].strip()
        debug(rte_desc)
    if 'dir_desc' in request.args.keys():
        dir_desc = request.args['dir_desc'].strip()
        debug(dir_desc)
    if 'user' in request.args.keys():
        user = request.args['user'].strip()
        debug(user)
    if 'csv' in request.args.keys():
        csv = request.args['csv']
        debug(csv)

    if csv:
        data = Helper.query_route_data(
            user=user, rte_desc=rte_desc, dir_desc=dir_desc,csv=csv
        )
        response = ""
        # build csv string
        for record in data:
            response += ','.join(record) + '\n'
    else:
        response = Helper.query_route_data(
            user=user, rte_desc=rte_desc, dir_desc=dir_desc
        )

    return jsonify(data=response)


@app.route('/surveyors')
def surveyor_status():
    return render_template('surveyors.html')


@app.route('/surveyors/_summary', methods=['GET'])
def surveyor_summary_query():
    response = []
    date = time.strftime("%Y-%m-%d")
    debug(request.args)
    debug(request.args['date'])
    if 'date' in request.args.keys():
        date = request.args['date'].strip()
    debug(date)
    debug(type(date))
    response = Helper.get_user_data(date)
    debug(response)
    return jsonify(data=response)


