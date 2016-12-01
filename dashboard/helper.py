# Copyright (C) 2016 Baofeng Dong
# This program is released under the "MIT License".
# Please see the file COPYING in the source
# distribution of this software for license terms.


import csv, os
from sqlalchemy import func, desc, distinct, cast, Integer
from flask import current_app, jsonify

from dashboard import Session as Session
from dashboard import debug, app, db
import simplejson as json
import pygal

app = current_app

DIRPATH = os.path.dirname(os.path.realpath(__file__))

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
        debug(ret_val)
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
    def query_map_data(rte_desc='', dir_desc=''):
        ret_val = []
        query_args = {}
        where = ""

        rte_desc_filter = " r.rte_desc = :rte_desc "
        dir_desc_filter = " r.dir_desc = :dir_desc "
        
        def construct_where(string, param, filt_name):
            if not param:
                return string

            if filt_name == "rte_desc": filt = rte_desc_filter
            else: filt = dir_desc_filter

            if string:
                return string + " AND " + filt
            else:
                return string + filt
      
        # build where clause
        debug(where)
        for param in [(rte_desc, 'rte_desc'),(dir_desc, 'dir_desc')]:
            where = construct_where(where, param[0], param[1])
            debug(where)
            debug(param[0])
            debug(param[1])
            query_args[param[1]] = param[0]
            debug(query_args)
        if where:
            where = " WHERE " + where
        region = " AND f.q5_orig_region='2' and f.q6_dest_region='2' "
        validate = " AND f.loc_validated='1' "
        not_null = " AND f.q3_orig_type is not null AND f.q4_dest_type is not null "
        limit = "limit 2000;"

        query_string = """
            select 
                f.rte,
                r.rte_desc,
                f.dir,
                r.dir_desc,
                case
                    when q3_orig_type = '1' then 'Home'
                    when q3_orig_type = '2' then 'Work'
                    when q3_orig_type = '3' then 'School'
                    when q3_orig_type = '4' then 'Recreation'
                    when q3_orig_type = '5' then 'Shopping'
                    when q3_orig_type = '6' then 'Personal business'
                    when q3_orig_type = '7' then 'Visit family or friends'
                    when q3_orig_type = '8' then 'Medical appointment'
                    when q3_orig_type = '9' then 'Other'
                end as o_type,
                case
                    when q4_dest_type = '1' then 'Home'
                    when q4_dest_type = '2' then 'Work'
                    when q4_dest_type = '3' then 'School'
                    when q4_dest_type = '4' then 'Recreation'
                    when q4_dest_type = '5' then 'Shopping'
                    when q4_dest_type = '6' then 'Personal business'
                    when q4_dest_type = '7' then 'Visit family or friends'
                    when q4_dest_type = '8' then 'Medical appointment'
                    when q4_dest_type = '9' then 'Other'
                end as d_type,
                f.q5_orig_lat as o_lat,
                f.q5_orig_lng as o_lng,
                f.q6_dest_lat as d_lat,
                f.q6_dest_lng as d_lng
            from odk.fall_survey_2016_view f
                join odk.rte_lookup r
                on f.rte::integer = r.rte and f.dir::integer = r.dir """

        query_string += where
        query_string += region
        query_string += validate
        query_string += not_null
        query_string += limit

        debug(query_string)

        web_session = Session()
        query = web_session.execute(query_string, query_args)

        RTE = 0
        RTE_DESC = 1
        DIR = 2
        DIR_DESC = 3
        OTYPE = 4
        DTYPE =5
        OLAT = 6
        OLNG = 7
        DLAT = 8
        DLNG = 9


        # each record will be converted as json
        # and sent back to page
        for record in query:

            data = {}
            data['rte'] = record[RTE]
            data['rte_desc'] = record[RTE_DESC]
            data['dir'] = record[DIR]
            data['dir_desc'] = record[DIR_DESC]
            data['o_type'] = record[OTYPE]
            data['d_type'] = record[DTYPE]
            data['o_lat'] = float(record[OLAT])
            data['o_lng'] = float(record[OLNG])
            data['d_lat'] = float(record[DLAT])
            data['d_lng'] = float(record[DLNG])

            ret_val.append(data)
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


    @staticmethod
    def get_user_data(date):

        surveyordata = []

        bar_chart = pygal.HorizontalBar(print_values=True)

        bar_chart.title = 'Number of Surveys by Surveyor on {0}'.format(date)

        web_session = Session()
        results = web_session.execute("""
            select 
                name, 
                string_agg(distinct route, ' || ') as routes, 
                count(route) as count,
                round(count(route)*100/(select count(*) from odk.users_tod where _date=:date)::numeric,2) as pct
            from odk.users_tod
                where _date=:date
                group by name
                order by count desc;""",{'date':date})

        for result in results:
            print(result[0],result[1],result[2],result[3])
            surveyordata.append([result[0],result[1],int(result[2]),float(result[3])])
            bar_chart.add(result[0],int(result[2]))

        web_session.close() 
        debug(surveyordata)
        bar_chart.render_to_file(os.path.join(DIRPATH, "static/image/{0}{1}.svg".format('surveyors-', date)))

        return surveyordata






