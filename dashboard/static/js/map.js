
    var sel_line = '';
    var sel_dir = '';
    var sel_args = {
        rte : "",
        dir : "",
        day : "",
        tod : "",
        orig : "",
        dest : ""
    }

    var dir_lookup = {};
    // creates layers for orig and dest markers
    var origMarkersLayer = new L.LayerGroup();
    var destMarkersLayer = new L.LayerGroup();
    //create layer of orig dest points pair layer
    var odPairLayer = new L.FeatureGroup();
    //create layer to store all orig dest points and path
    var odPairLayerGroup = new L.FeatureGroup();
    //create layer of transit routes layer
    var routeLayer = new L.FeatureGroup();

    var hasLegend = false;
    var highLight = null;
    var selected;
    var style = {
                color: '#ff6600',
                weight: 2,
                opacity: 0.6,
                smoothFactor: 1,
                dashArray: '10,10',
                clickable: true
    };
    var dmarkerStyle = {
                clickable: true,
                fillColor: "#4BF01B",
                radius: 10,
                weight: 1,
                opacity: 0.2,
                fillOpacity: 0.6
    };
    var omarkerStyle = {
                clickable: true,
                fillColor: "#259CEF",
                radius: 10,
                weight: 1,
                opacity: 0.2,
                fillOpacity: 0.6
    };
    var newStyle = {
                color:'red',
                opacity: 0.9,
                weight:5
    }

//initialize map 
$(document).ready(function() {
    mymap = L.map('mapid', {scrollWheelZoom:true}).setView([45.48661, -122.65343], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG11c2VyMTk3IiwiYSI6ImNpc254cHk1YTA1dngydm14bjkyamQ1NmsifQ.8ya7T1hHXtVmYOwMrVIuFw', {
    attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>',
    id: 'mapbox.light',
    maxZoom: 18,
    minZoom: 11
    }).addTo(mymap);

    //load map with markers on initial page load with no filter params
    rebuild(sel_args);

    $('#filter_line a').on('click', function() {
        sel_line = $(this).attr('rte');
        console.log(sel_line);
        sel_args.rte = sel_line;
        sel_dir = '';
        $("#line_btn").text(this.text+' ').append('<span class="caret"></span>');

        if (this.text == "All") {
            //resert direction
            //show directions even the select is all
            $(".direction_cls").show();
            sel_args.rte = '';
        }
        else {
            //update direction dropdown with correct names
            var dir = dir_lookup[sel_line];
            console.log(this.text);
            console.log(dir_lookup);
            $("#outbound_link").text(dir[0].dir_desc).attr("dir", dir[0].dir).show();
            console.log(dir);
            $("#inbound_link").text(dir[1].dir_desc).attr("dir", dir[1].dir).show();
            $(".direction_cls").show();
        }
        
        $("#dir_btn").text('All ').append('<span class="caret"></span>');
        
        if (sel_line == 'All') {
            sel_line = '';
            sel_dir = '';
            sel_args.rte = '';
            sel_args.dir = '';
        }


        rebuild(sel_args);
        routeLayer.clearLayers();
        if (sel_args.rte) {
            addRouteJson(sel_line,0);
        }

    });

    $('#filter_dir a').on('click', function() {

        sel_dir = $(this).attr("dir");
        console.log("sel_dir: " + sel_dir);
        sel_args.dir = sel_dir;
        console.log(sel_args);
        $("#dir_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        if (sel_dir == 'All') {
            sel_dir = '';
            sel_args.dir = '';
        } 
        origMarkersLayer.clearLayers();
        destMarkersLayer.clearLayers();
        odPairLayerGroup.clearLayers();
        //rebuild({'rte':sel_line, 'dir':sel_dir});
        rebuildPath(sel_args);

        console.log(sel_args);
        // add addRouteJson function to here
        routeLayer.clearLayers();
        addRouteJson(sel_line,sel_dir);
    });

    $('#filter_day a').on('click', function() {

        var sel_day = this.text
        console.log("day selected: " + sel_day)
        sel_args.day = sel_day;

        $("#day_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        rebuild(sel_args);
        if (sel_args.rte && sel_args.dir) {
            odPairLayerGroup.clearLayers();
            rebuildPath(sel_args);
        }
        

    });

    $('#filter_origin a').on('click', function() {

        var sel_orig = this.text
        console.log("origin selected: " + sel_orig)
        sel_args.orig = sel_orig;

        $("#origin_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        rebuild(sel_args);
        if (sel_args.rte && sel_args.dir) {
            odPairLayerGroup.clearLayers();
            rebuildPath(sel_args);
        }
        

    });

    $('#filter_dest a').on('click', function() {

        var sel_dest = this.text
        console.log("destination selected: " + sel_dest);
        sel_args.dest = sel_dest;

        $("#dest_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        rebuild(sel_args);
        if (sel_args.rte && sel_args.dir) {
            odPairLayerGroup.clearLayers();
            rebuildPath(sel_args);
        }


    });

    $('#filter_tod a').on('click', function() {

        var sel_tod = this.text
        console.log("time of day selected: " + sel_tod);
        if (sel_tod == 'All') {
            sel_args.tod = '';
        }
        else {
            sel_args.tod = sel_tod;
        }

        $("#tod_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        rebuild(sel_args);
        if (sel_args.rte && sel_args.dir) {
            odPairLayerGroup.clearLayers();
            rebuildPath(sel_args);
        }


    });

})


    //set when a route, direction or user is selected from dropdowns
    $(directions).each(function(index, item) {
        //console.log(directions);
        if(!dir_lookup.hasOwnProperty(item.rte)) {
            dir_lookup[item.rte] = [null, null];
        }
        dir_lookup[item.rte][item.dir] = item;


    });

    console.log(dir_lookup);

// add route GeoJson to map based on sel_line and sel_dir

function addRouteJson(sel_line, sel_dir) {

    console.log(sel_line);
    console.log(sel_dir);

    var routeJson = sel_line + '_' + sel_dir + '_routes.geojson';
    console.log(routeJson);
    var path = base + 'static/geojson/';

    $.getJSON(path + routeJson, function(data) {
        var route = L.geoJson(data, {
            style: function (feature) {
                return {
                        color: getBaseColor(feature.properties.rte),
                        weight: 2.5,
                        opacity: 0.80
                };
            }
        }).addTo(routeLayer);

        routeLayer.addTo(mymap);
        routeLayer.bringToFront();
        console.log("added to mymap!");
    })

}


function rebuild(args) {
    //clear previous orig and dest markers
    //origMarkersLayer.clearLayers();
    //destMarkersLayer.clearLayers();
    odPairLayerGroup.clearLayers();

    console.log(args);

    $.getJSON('map/_query', args, function(data) {

        //retrive origin and destination lat and lng

        console.log(data);

        $(data.data).each(function(index, item) {
            // get origin lat and long from data.data json
            var o_lat = item.o_lat;
            var o_lng = item.o_lng;
            // get destination lat and long
            var d_lat = item.d_lat;
            var d_lng = item.d_lng;

            // defines popup content for orig markers
            var orig_popup = L.popup().setLatLng([o_lat,o_lng]).setContent(
                "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                "<b>Direction:</b>" + " " + item.dir_desc + '<br />' +
                "<b>Origin:</b>" + " " + item.o_type);

            // defines popup content for destination markers
            var dest_popup = L.popup().setLatLng([d_lat,d_lng]).setContent(
                "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                "<b>Direction:</b>" + " " + item.dir_desc + '<br />' +
                "<b>Destination:</b>" + " " + item.d_type);


            // lat and lng for orig and dest markers
            var olatlng = L.latLng([o_lat,o_lng]);
            var dlatlng = L.latLng([d_lat,d_lng]);
            //defines orig marker
            var orig_marker = L.circleMarker(olatlng, omarkerStyle).bindPopup(orig_popup, {showOnMouseOver:true});
            //defines dest marker
            var dest_marker = L.circleMarker(dlatlng, dmarkerStyle).bindPopup(dest_popup, {showOnMouseOver:true});
            //add orig and dest markers to odPairLayerGroup
            odPairLayerGroup.addLayer(orig_marker);
            odPairLayerGroup.addLayer(dest_marker);
            // add odPairLayerGroup to mymap
            odPairLayerGroup.addTo(mymap);

        });

    });
    addLabel();
}

//to add path between origin and destination points
function rebuildPath(args) {
    //clear layers
    odPairLayerGroup.clearLayers();

    console.log(args);

    $.getJSON('map/_query', args, function(data) {

        console.log(data);

        $(data.data).each(function(index, item) {
            // get origin lat and long from data.data json
            var o_lat = item.o_lat;
            var o_lng = item.o_lng;
            // get destination lat and long
            var d_lat = item.d_lat;
            var d_lng = item.d_lng;

            // lat and lng for orig and dest markers
            var olatlng = L.latLng([o_lat,o_lng]);
            var dlatlng = L.latLng([d_lat,d_lng]);
            //defines points pair list for the path
            var odPair = [olatlng, dlatlng];
            //defines the path that links orig and dest markers
            var pairPath = new L.Polyline(odPair, style);

            var popup = L. popup().setContent(
                "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                "<b>Direction:</b>" + " " + item.dir_desc + '<br />' + 
                "<b>Satisfaction:</b>" + " " + item.satisfaction + '<br />' + 
                "<b>Travel Change:</b>" + " " + item.travel_change + '<br />' +
                "<b>Job Approval:</b>" + " " + item.job_approval + '<br />' +
                "<b>One Change:</b>" + " " + item.one_change + '<br />' +
                "<b>Origin:</b>" + " " + item.o_type + '<br />' + 
                "<b>Destination:</b>" + " " + item.d_type + '<br />' + 
                "<b>Ridership:</b>" + " " + item.ridership + '<br />' +
                "<b>Rider Years:</b>" + " " + item.ride_years + '<br />' +
                "<b>Age:</b>" + " " + item.age + '<br />' +
                "<b>Gender:</b>" + " " + item.gender + '<br />' +
                "<b>Income:</b>" + " " + item.income
                );

            pairPath.bindPopup(popup);
            
            pairPath.on('mouseover', function(e) {

                var path = e.target;
                path.setStyle({
                    color:'purple',
                    opacity: 0.9,
                    weight:5,
                    dashArray: '10,10'
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    path.bringToFront();
                }
            });
            pairPath.on('mouseout', function(e) {
                var path = e.target;
                path.setStyle(style);
            });
            //defines orig marker
            var orig_marker = L.circleMarker(olatlng, omarkerStyle);
            //defines dest marker
            var dest_marker = L.circleMarker(dlatlng, dmarkerStyle);
            //adds the path to odPairLayerGroup
            odPairLayerGroup.addLayer(pairPath);
            odPairLayerGroup.addLayer(orig_marker);
            odPairLayerGroup.addLayer(dest_marker);
            //adds odPairLayerGroup to mymap
            odPairLayerGroup.addTo(mymap);
        });
    });
}

function removeHighlight() {
    //check for highlight
    if (highLight !== null) {
        //set default style
        highLight.setStyle(getDefaultStyle());
        //reset highLight
        highLight = null;
    }
}


//add label to map
function addLabel() {

    if(hasLegend) {
        return
    }

    var legend = L.control({position: 'bottomleft'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend');
        categories = ['ORIGIN','DESTINATION'];

        for (var i = 0; i < categories.length; i++) {
            div.innerHTML +=
                '<i class="circle" style="background:' + getColor(categories[i]) + '"></i> ' +
                 (categories[i] ? categories[i] + '<br>' : '+');

        }

        return div;
    };

    legend.addTo(mymap);

    hasLegend = true;

}

function getColor(d) {
    return  d == 'ORIGIN' ? "#259CEF" :
            d == 'DESTINATION' ? "#4BF01B" :
                                 'red' ;
}

function getBaseColor(rte) {
    return rte == 90  ? '#d02c0f' :
           rte == 100 ? '#0069AA' :
           rte == 190 ? '#FFC425' :
           rte == 200 ? '#008752' :
           rte == 203 ? '#c044ec' :
           rte == 290 ? '#D15F27' :
                        '#1c4ca5' ;
}

/*function getTypeColor(loctype) {
 return loctype = 'Home' ? '#CE71EC' :
        loctype = 'Work' ? '#EE843A' :
        loctype = 'School' ? '#6EEE3F' :
        loctype = 'Recreation' ? '#45C9F3' :
        loctype = 'Shopping' ? '#F345D6' :
        loctype = 'Personal business' ? '#7ECFEE' :
        loctype = 'Visit family or friends' ? '#7E8AEE' :
        loctype = 'Medical appointment' ? '#E7EC89' :
        loctype = 'Other' ? '#71716D' :
                   '#80ff00';
}

function style(feature) {
    return {
                    fillColor: getTypeColor(feature["o_type"]),
                    weight: 1,
                    opacity: 0.0,
                    fillOpacity: 0.4

    }
}*/
