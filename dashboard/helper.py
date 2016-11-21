# Copyright (C) 2016 Baofeng Dong
# This program is released under the "MIT License".
# Please see the file COPYING in the source
# distribution of this software for license terms.


import csv, os

from sqlalchemy import func, desc, distinct, cast, Integer
from flask import current_app

from dashboard import Session as Session
from dashboard import debug, app, db
import simplejson as json

app = current_app

GREEN_STATUS = '#76DB55'
RED_STATUS = '#DB5555'
INBOUND = '1'
OUTBOUND = '0'
DIRECTION = {'1':'Inbound', '0':'Outbound'}
TRAINS = ['90','100', '190','200','290']


class Helper(object):

    @staticmethod
    def get_routes():
        ret_val = []
        
        web_session = Session()
        routes = web_session.execute("""
            SELECT distinct rte, rte_desc
            FROM odk.rte_lookup
            ORDER BY rte;""")

        RTE = 0
        RTE_DESC = 1
        ret_val = [ {'rte':str(route[RTE]), 'rte_desc':route[RTE_DESC]}
            for route in routes ]
        web_session.close()
        
        return ret_val

    @staticmethod
    def get_directions():
        ret_val = []
        web_session = Session()
        directions = web_session.execute("""
            SELECT rte, rte_desc, dir, dir_desc
            FROM odk.rte_lookup
            ORDER BY rte, dir;""")

        RTE = 0
        RTE_DESC = 1
        DIR = 2
        DIR_DESC = 3

        ret_val = [ {'rte':str(direction[RTE]), 'rte_desc':direction[RTE_DESC],
            'dir':int(direction[DIR]), 'dir_desc':direction[DIR_DESC]}
            for direction in directions ]
        web_session.close()
        return ret_val




    @staticmethod
    def query_route_data(user='', rte_desc='', dir_desc='', csv=False):
        ret_val = []
        query_args = {}
        where = ""

        #if user: user = "%" + user + "%"
        user_filter = " s.name = :user"
        rte_desc_filter = " r.rte_desc = :rte_desc "
        dir_desc_filter = " r.dir_desc = :dir_desc "
        
        def construct_where(string, param, filt_name):
            if not param:
                return string

            if filt_name == "user": filt = user_filter
            elif filt_name == "rte_desc": filt = rte_desc_filter
            else: filt = dir_desc_filter

            if string:
                return string + " AND " + filt
            else:
                return string + filt
      
        # build where clause
        debug(where)
        for param in [(user, 'user'),(rte_desc, 'rte_desc'),(dir_desc, 'dir_desc')]:
            where = construct_where(where, param[0], param[1])
            debug(where)
            query_args[param[1]] = param[0]
        if where:
            where = " WHERE " + where
        
        limit = "LIMIT 300;"
        if csv:
            # add headers to csv data
            ret_val.append(
                ['date','time','user','rte_desc','dir_desc','satisfaction', 'comments'])
            
            limit = ";"

        query_string = """
            select 
                r.rte_desc,
                r.dir_desc, 
                f._date, 
                date_trunc('second',f._end) as _time, 
                s.name as user, 
                case
                    when q1_satisfaction = '1' then 'Very satisfied'
                    when q1_satisfaction = '2' then 'Somewhat satisfied'
                    when q1_satisfaction = '3' then 'Neutral'
                    when q1_satisfaction = '4' then 'Somewhat dissatisfied'
                    when q1_satisfaction = '5' then 'Very dissatisfied'
                    when q1_satisfaction = '6' then 'Do not know'
                end as satisfaction,
                coalesce(f.q2_satis_comments,'')
            from odk.fall_survey_2016_view f
            join odk.rte_lookup r
            on f.rte::integer = r.rte and f.dir::integer = r.dir
            join odk.surveyors s
            on f._surveyor = s.username """
        query_string += where
        query_string += " ORDER BY f._date DESC, f._end DESC "
        query_string += limit

        debug(query_string)

        web_session = Session()
        query = web_session.execute(query_string, query_args)

        RTE_DESC = 0
        DIR_DESC = 1
        DATE = 2
        TIME = 3
        USER = 4
        SATISFACTION = 5
        COMMENTS = 6

        # each record will be converted as json
        # and sent back to page
        for record in query:
            if csv:
                data = []
                data.append(str(record[DATE]))
                data.append(str(record[TIME]))
                data.append(record[USER])
                data.append(record[RTE_DESC])
                data.append(record[DIR_DESC])
                data.append(record[SATISFACTION])
                data.append(record[COMMENTS])
            else:
                data = {}
                data['date'] = str(record[DATE])
                data['time'] = str(record[TIME])
                data['user'] = record[USER]
                data['rte_desc'] = record[RTE_DESC]
                data['dir_desc'] = record[DIR_DESC]
                data['satisfaction'] = record[SATISFACTION]
                data['comments'] = record[COMMENTS]
            ret_val.append(data)
        web_session.close()
        return ret_val


    @staticmethod
    def get_users():

        users = []
        session = Session()
        results = session.execute("""
            SELECT name
            FROM odk.surveyors
            ORDER BY name;""")

        for result in results:
            print((dict(result)))
            print("Type:", type(dict(result)))
            user_dict = dict(result)
            print(user_dict)
            user = user_dict.get('name')
            users.append(str(user))

        session.close()
        return users






