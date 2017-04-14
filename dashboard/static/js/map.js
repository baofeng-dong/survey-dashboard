
    var sel_line = '';
    var sel_dir = '';
//dictionary for storing query params and values
    var sel_args = {
        rte : "",
        dir : "",
        day : "",
        tod : "",
        orig : "",
        dest : "",
        travel: "",
        satisfaction: ""
    }

    //creates a list to store origin and destination latlng objects
    var originList = [];
    var destinationList = [];

    var mapData = [];

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
    //create origin and destination points heat layergroups
    var originHeatGroup = new L.FeatureGroup();
    var destHeatGroup = new L.FeatureGroup();

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

    var heatmapOptions = {
                radius: 25,
                maxZoom:16
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
    console.log(mymap);

    var geocoder = L.control.geocoder('mapzen-JfUFYiC', geocoderOptions);
    var geocoderOptions = {
        autocomplete: true,
        pointIcon: 'https://cdn2.iconfinder.com/data/icons/travel-map-and-location/64/geo_location-128.png',
        position: 'topleft',
        expanded: true,
        panToPoint: true,
        placeholder: 'Search nearby',
        markers: true,
        focus: [45.48661, -122.65343],
        title: 'Address Search'
    }
    var markeroptions = {
        icon: myIcon,
        clickable: true,
        riseOnHover: true
    }
    var myIcon = L.icon({
        iconUrl: 'https://cdn2.iconfinder.com/data/icons/travel-map-and-location/64/geo_location-128.png',
        iconSize: [38, 95],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
    });

    geocoder.setPosition('topright');

    //add geocoder to mymap
    geocoder.addTo(mymap);

    //set mapview checkbox for point map true
    $('input.checkview')[0].checked = true;
    //set mapview checkboxes for heatmap false
    $('input.checkview')[1].checked = false;
    $('input.checkview')[2].checked = false;

    $("input[type='checkbox']").change(
        function() {
            $('input[type="checkbox"]').not(this).prop('checked', false);
            if ($('input.checkview')[0].checked) {
                //clear layers
                resetLayers();
                removeLayers(mymap);
                rebuild(sel_args);
                if (sel_args.rte && sel_args.dir) {
                    rebuildPath(sel_args);
                }
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else if ($('input.checkview')[1].checked) {
                resetLayers();
                removeLayers(mymap);
                buildHeatmap(sel_args, addOriginHeatMap, function(){});
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                buildHeatmap(sel_args, function(){}, addDestHeatMap);
                console.log("dest heatmap added!");
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            }
        });

    toggle_tb();

    //load map with markers on initial page load with no filter params
    rebuild(sel_args);
    //function for when a bus/MAX/WES route is selected
    $('#filter_line a').on('click', function() {
        sel_line = $(this).attr('rte');
        console.log(sel_line);
        sel_args.rte = sel_line;
        sel_dir = '';
        console.log(sel_dir);
        sel_args.dir = sel_dir;
        console.log(sel_args);
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
            //console.log(dir_lookup);
            $("#outbound_link").text(dir[0].dir_desc).attr("dir", dir[0].dir).show();
            //console.log(dir);
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
        resetLayers();
        //add mapview based on which checkbox is selected
        addMapview();
        if (sel_line && sel_dir !== null) {
            addRouteJson(sel_line,0);
            console.log("route geojson added!");
        }
    });
    //function for when direction for a route is selected
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
        console.log(sel_dir);
        console.log(sel_args);
        resetLayers();
        //add map based on which mapview box is checked
        addMapview();
        //add route geojson based on rte and dir
        addRouteJson(sel_line,sel_dir);
    });
    //function for when day of week is selected
    $('#filter_day a').on('click', function() {
        var sel_day = this.text
        console.log("day selected: " + sel_day)
        sel_args.day = sel_day;

        $("#day_btn").text(this.text+' ').append('<span class="caret"></span>');
        resetLayers();
        //add maps based on which mapview checkbox is checked
        addMapview();
    });
    //function for when origin type is selected
    $('#filter_origin a').on('click', function() {
        var sel_orig = this.text
        console.log("origin selected: " + sel_orig)
        if (sel_orig == 'All') {
            sel_args.orig = '';
        } else {
            sel_args.orig = sel_orig;
        }
        $("#origin_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        //add maps based on which mapview checkbox is checked
        addMapview();
        if (sel_line && sel_dir !== null) {
            addRouteJson(sel_line,0);
            console.log("route geojson added!");
        }
    });
    //function for when destination type is selected
    $('#filter_dest a').on('click', function() {
        var sel_dest = this.text
        console.log("destination selected: " + sel_dest);
        if (sel_dest == 'All') {
            sel_args.dest = '';
        } else {
            sel_args.dest = sel_dest;
        }

        $("#dest_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        //add maps based on which mapview checkbox is checked
        addMapview();
        if (sel_line && sel_dir !== null) {
            addRouteJson(sel_line,0);
            console.log("route geojson added!");
        }
    });
    //function for when time of day is selected
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

        resetLayers();
        //add maps based on which mapview checkbox is checked
        addMapview();
    });
    //function for when travel more/same/less is selected
    $('#filter_travel a').on('click', function() {
        var sel_travel = this.text
        console.log("travel change selected: " + sel_travel);
        if (sel_travel == 'All') {
            sel_args.travel = '';
        }
        else {
            sel_args.travel = sel_travel;
        }

        $("#travel_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        //add maps based on which mapview checkbox is checked
        addMapview();
    });
    //function for when satisfaction level is selected
    $('#filter_satisfaction a').on('click', function() {
        var sel_satisfaction = this.text
        console.log("satisfaction selected: " + sel_satisfaction);
        if (sel_satisfaction == 'All') {
            sel_args.satisfaction = '';
        }
        else {
            sel_args.satisfaction = sel_satisfaction;
        }

        $("#satisfaction_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        //add maps based on which mapview checkbox is checked
        addMapview();
    });
});


    //set when a route, direction or user is selected from dropdowns
    $(directions).each(function(index, item) {
        //console.log(directions);
        if(!dir_lookup.hasOwnProperty(item.rte)) {
            dir_lookup[item.rte] = [null, null];
        }
        dir_lookup[item.rte][item.dir] = item;

    });

    console.log(dir_lookup);

//add different maps based on the map view box selected
function addMapview () {
        //if point map selected
        if ($('input.checkview')[0].checked) {
            rebuild(sel_args);
            if (sel_args.rte && sel_args.dir) {
                rebuildPath(sel_args);
            }
        } else {
            //clear layers
            removeLayers(mymap);
            buildHeatmap(sel_args, addOriginHeatMap, addDestHeatMap);
        }
}

//remove layers
function removeLayers(map) { 
    map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer == false) {
            map.removeLayer(layer);
            console.log("removed layer!");
            console.log(layer._leaflet_id);
        }
    })
} 

//clear all points and path layers
function resetLayers() {
    origMarkersLayer.clearLayers();
    destMarkersLayer.clearLayers();
    odPairLayerGroup.clearLayers();
}

//add origin points heatmap to mymap
function addOriginHeatMap(originList) {
    originHeatGroup.clearLayers();
    var originHeat = L.heatLayer(originList, heatmapOptions);
    //add origin points heatmap to mymap
    originHeat.redraw();
    console.log("redraw heatmap!");
    originHeat.addTo(mymap);
    console.log("add origin heatmap executed!");
}

//add destination points heatmap to mymap
function addDestHeatMap(destinationList) {
    var destHeat = L.heatLayer(destinationList, heatmapOptions);
    //add origin points heatmap to mymap
    destHeat.redraw();
    console.log("redraw dest heatmap!");
    destHeat.addTo(mymap);
    console.log("add dest heatmap executed!");
}

// add route GeoJson to map based on sel_line and sel_dir
function addRouteJson(sel_line, sel_dir) {
    routeLayer.clearLayers();
    console.log(sel_line);
    console.log(sel_dir);

    if (sel_dir === undefined) {
        sel_dir = 0;
    }
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
//function to send query to map/_query to args and build the points map
function rebuild(args) {
    //clear previous orig and dest markers
    resetLayers();

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
            var olatlng = L.latLng(o_lat,o_lng);
            var dlatlng = L.latLng(d_lat,d_lng);

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

function queryData(args) {
    console.log(args);
    var promise = $.getJSON('map/_query', args);
    promise.done(function(data){
        console.log(data);
        mapData = data.data;
        console.log(mapData);
        console.log("data returned!");
        return mapData;
    });
}

//to build the origin and destination points arrays
function buildHeatmap(args, callback1, callback2) {
    
    odPairLayerGroup.clearLayers();
    console.log(args);

    $.getJSON('map/_query', args, function(data) {
        //clear the origin and destination points arrays
        originList.length = 0;
        console.log("origin list array cleared!");
        destinationList.length = 0;
        console.log("destinationList cleared!");

        console.log(data);

        $(data.data).each(function(index, item) {
            // get origin lat and long from data.data json
            var o_lat = item.o_lat;
            var o_lng = item.o_lng;
            // get destination lat and long
            var d_lat = item.d_lat;
            var d_lng = item.d_lng;

            //adds origin and dest objects to their corresponding lists
            originList.push([o_lat, o_lng]);
            destinationList.push([d_lat, d_lng]);

        });
        console.log(originList.length);
        console.log(destinationList.length);
        if($('input.checkview')[1].checked && callback1) {
            callback1(originList);
        }
        if ($('input.checkview')[2].checked && callback2) {
            callback2(destinationList);
        }
    });
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

function generateOriginHeatmap() {
    $('#origin-button').on('click', '#toggle', function(){
    console.log(this.value);

    resetLayers();
    console.log("reset points layers!")
    addOriginHeatMap(originList);
    console.log("added origin points heatmap!")
    });
}

//function for expanding/collapsing div content
function toggle_tb(){
    var div = $("#control-section");
    $('#toggle').unbind("click").click(function(){
         //div.slideToggle('fast');
         
         if ($(this).attr('value') == 'Hide') {
            console.log(this + 'hide selected')
            div.animate({
                height: '0%'
                }).hide()
            $(this).attr('value','Show')
            
        } else {
            console.log(this + 'show selected')
            div.animate({
                height: '100%'
                }).show()
            $(this).attr('value','Hide')
        
            }
       });
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