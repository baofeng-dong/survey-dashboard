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
    def query_map_data(where):
        ret_val = []
        query_args = {}
        where = where

        """rte_filter = " r.rte = :rte "
        dir_filter = " r.dir = :dir "
        day_filter = " r."
        
        def construct_where(string, param, filt_name):
            if not param:
                return string

            if filt_name == "rte": filt = rte_filter
            else: filt = dir_filter

            if string:
                return string + " AND " + filt
            else:
                return string + filt
      
        # build where clause
        debug(where)
        for param in [(rte, 'rte'),(dir, 'dir')]:
            where = construct_where(where, param[0], param[1])
            debug(where)
            debug(param[0])
            debug(param[1])
            query_args[param[1]] = param[0]
            debug(query_args)
        if where:
            where = " WHERE " + where"""
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
                    when q1_satisfaction = '1' then 'Very satisfied'
                    when q1_satisfaction = '3' then 'Somewhat satisfied'
                    when q1_satisfaction = '4' then 'Neutral'
                    when q1_satisfaction = '5' then 'Somewhat dissatisfied'
                    when q1_satisfaction = '6' then 'Very dissatisfied'
                    when q1_satisfaction = '7' then 'Do not know'
                    else                            ''
                end as satisfaction,
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
                    else                         ''
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
                    else                         ''
                end as d_type,
                f.q5_orig_lat as o_lat,
                f.q5_orig_lng as o_lng,
                f.q6_dest_lat as d_lat,
                f.q6_dest_lng as d_lng,
                case
                    when q7_travel_change = '1' then 'More'
                    when q7_travel_change = '2' then 'Same'
                    when q7_travel_change = '3' then 'Less'
                    when q7_travel_change = '4' then 'Do not know'
                    else                             ''
                end as ride_change,
                case
                    when q18_ridership = '1' then 'Frequent rider'
                    when q18_ridership = '2' then 'Regular rider'
                    when q18_ridership = '3' then 'Occasional rider'
                    when q18_ridership = '4' then 'Infrequent rider'
                    when q18_ridership = '5' then 'Do not know'
                    else                          ''
                end as ridership,
                case
                    when q19_ride_years = '1' then 'Less than 1 year'
                    when q19_ride_years = '2' then '1 to 2 years'
                    when q19_ride_years = '3' then '3 to 5 years'
                    when q19_ride_years = '4' then '6 to 10 years'
                    when q19_ride_years = '5' then 'Over 10 years'
                    when q19_ride_years = '6' then 'Do not know'
                    else                           ''
                end as ride_years,
                case
                    when q20_approval = '1' then 'Strongly approve'
                    when q20_approval = '2' then 'Somewhat approve'
                    when q20_approval = '3' then 'Somewhat disapprove'
                    when q20_approval = '4' then 'Strongly disapprove'
                    when q20_approval = '5' then 'Do not know'
                    else                         ''
                end as job_approval,
                case
                    when q21_one_change = '1' then 'Frequency improved'
                    when q21_one_change = '2' then 'Reliability improved'
                    when q21_one_change = '3' then 'Service expanded'
                    when q21_one_change = '4' then 'Routes go to more places'
                    when q21_one_change = '5' then 'Stops closer to my origin/destination'
                    when q21_one_change = '6' then 'Crowding less'
                    when q21_one_change = '7' then 'Faster trip'
                    when q21_one_change = '8' then 'Transfer less'
                    when q21_one_change = '9' then 'Safer trip'
                    when q21_one_change = '10' then 'Fare less expensive'
                    when q21_one_change = '11' then 'Other'
                    when q21_one_change = '12' then 'Nothing'
                    when q21_one_change = '13' then 'Do not know'
                    else                            ''
                end as one_change,
                coalesce(f.q24_zipcode, 10000),
                case
                    when q25_age = '1' then 'Under 18'
                    when q25_age = '2' then '18-24'
                    when q25_age = '3' then '25-34'
                    when q25_age = '4' then '35-44'
                    when q25_age = '5' then '45-54'
                    when q25_age = '6' then '55-64'
                    when q25_age = '7' then '65 or more'
                    else                    ''
                end as age,
                case 
                    when q26_gender = '1' then 'Female'
                    when q26_gender = '2' then 'Male'
                    when q26_gender = '3' then 'Transgender'
                    when q26_gender = '4' then 'Other'
                    else                       ''
                end as gender,
                case
                    when q29_income = '1' then 'Under $10,000'
                    when q29_income = '2' then '$10,000-$19,999'
                    when q29_income = '3' then '$20,000-$29,999'
                    when q29_income = '4' then '$30,000-$39,999'
                    when q29_income = '5' then '$40,000-$49,999'
                    when q29_income = '6' then '$50,000-$59,999'
                    when q29_income = '7' then '$60,000-$69,999'
                    when q29_income = '8' then '$70,000-$79,999'
                    when q29_income = '9' then '$80,000-$89,999'
                    when q29_income = '10' then '$90,000-$99,999'
                    when q29_income = '11' then '$100,000-$124,999'
                    when q29_income = '12' then '$125,000-$150,000'
                    when q29_income = '13' then 'Over $150,000'
                    when q29_income = '14' then 'Do not know'
                    else                        ''
                end as income
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
        query = web_session.execute(query_string)

        RTE = 0
        RTE_DESC = 1
        DIR = 2
        DIR_DESC = 3
        SATISFACTION = 4
        OTYPE = 5
        DTYPE =6
        OLAT = 7
        OLNG = 8
        DLAT = 9
        DLNG = 10
        TRAVEL_CHANGE = 11
        RIDERSHIP = 12
        RIDE_YEARS = 13
        JOB_APPROVAL = 14
        ONE_CHANGE = 15
        ZIPCODE = 16
        AGE = 17
        GENDER = 18
        INCOME = 19


        # each record will be converted as json
        # and sent back to page
        for record in query:

            data = {}
            data['rte'] = record[RTE]
            data['rte_desc'] = record[RTE_DESC]
            data['dir'] = record[DIR]
            data['dir_desc'] = record[DIR_DESC]
            data['satisfaction'] = record[SATISFACTION]
            data['o_type'] = record[OTYPE]
            data['d_type'] = record[DTYPE]
            data['o_lat'] = float(record[OLAT])
            data['o_lng'] = float(record[OLNG])
            data['d_lat'] = float(record[DLAT])
            data['d_lng'] = float(record[DLNG])
            data['travel_change'] = record[TRAVEL_CHANGE]
            data['ridership'] = record[RIDERSHIP]
            data['ride_years'] = record[RIDE_YEARS]
            data['job_approval'] = record[JOB_APPROVAL]
            data['one_change'] = record[ONE_CHANGE]
            data['zipcode'] = record[ZIPCODE]
            data['age'] = record[AGE]
            data['gender'] = record[GENDER]
            data['income'] = record[INCOME]

            ret_val.append(data)
        web_session.close()
        return ret_val
    @staticmethod
    def buildconditions(args):
        where = ""
        lookupwd = {
        "Weekday": "(1,2,3,4,5)",
        "Weekend": "(0,6)",
        "Saturday": "(6)",
        "Sunday": "(0)"
        }

        lookupvehicle = {
        "MAX": "IN ('90','100','190','200','290')",
        "WES": "IN ('203')",
        "Bus": "NOT IN ('90','100','190','200','290','203')"
        }

        lookuprtetype = {
        "MAX": "1",
        "Bus Crosstown": "2",
        "Bus Eastside Feeder": "3",
        "Bus Westside Feeder": "4",
        "Bus Radial": "5",
        "WES": "6"
        }

        lookuptod = {
        "Weekday Early AM": "1",
        "Weekday AM Peak": "2",
        "Weekday Midday": "3",
        "Weekday PM Peak": "4",
        "Weekday Night": "5",
        "Weekend Morning": "6",
        "Weekend Midday": "7",
        "Weekend Night": "8"
        }

        lookupaddress = {
        "Home": "1",
        "Work": "2",
        "School": "3",
        "Recreation": "4",
        "Shopping": "5",
        "Personal business": "6",
        "Visit family or friends": "7",
        "Medical appointment": "8",
        "Other": "9"
        }

        for key, value in args.items():
            # app.logger.debug(key,value)
            if not value: continue

            if key == "rte" and value.isnumeric():
                where += " AND f.rte='{0}'".format(value)

            if key == "dir" and value.isnumeric():
                where += " AND f.dir='{0}'".format(value)

            if key == "day" and value in lookupwd:
                where += " AND extract(dow from f._date) in {0}".format(lookupwd[value])

            if key == "tod" and value in lookuptod:
                where += " AND time_of_day='{0}'".format(lookuptod[value])

            if key == "orig" and value in lookupaddress:
                where += " AND f.q3_orig_type='{0}'".format(lookupaddress[value])

            if key == "dest" and value in lookupaddress:
                where += " AND f.q4_dest_type='{0}'".format(lookupaddress[value])

        return where

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
                    when q1_satisfaction = '3' then 'Somewhat satisfied'
                    when q1_satisfaction = '4' then 'Neutral'
                    when q1_satisfaction = '5' then 'Somewhat dissatisfied'
                    when q1_satisfaction = '6' then 'Very dissatisfied'
                    when q1_satisfaction = '7' then 'Do not know'
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






