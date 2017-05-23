
    var sel_line = '';
    var sel_dir = '';
    var sel_boundary = '';
    var dest_sep = '';
    var sep_dict = {};
    var zip_dict = {};
    var zipcode_geojson = {};
    var sepLayer = "sep_bounds.geojson";
    var tmLayer = "tm_fill.geojson";
    var zipLayer = "zipcode_tm.geojson";
    var boundary;
//dictionary for storing query params and values
    var sel_args = {
        rte : "",
        dir : "",
        day : "",
        tod : "",
        orig : "",
        dest : "",
        travel: "",
        satisfaction: "",
        boundary: "",
        dest_sep: ""
    }

    //creates a list to store origin and destination latlng objects
    var originList = [];
    var destinationList = [];

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
    //create boundary geojson layergroup
    var boundaryLayer = new L.FeatureGroup();
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
    mymap = L.map('mapid', {scrollWheelZoom:true}).setView([45.48661, -122.65343], 10);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG11c2VyMTk3IiwiYSI6ImNpc254cHk1YTA1dngydm14bjkyamQ1NmsifQ.8ya7T1hHXtVmYOwMrVIuFw', {
    attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>',
    id: 'mapbox.light',
    maxZoom: 18,
    minZoom: 10
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

    //add TriMet service district boundary to map on load
    addLayer("tm_fill.geojson");

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

                addLayer(tmLayer);
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
                addLayer(tmLayer);
                buildHeatmap(sel_args, addOriginHeatMap, function(){});
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else if ($('input.checkview')[2].checked) {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                addLayer(tmLayer);
                buildHeatmap(sel_args, function(){}, addDestHeatMap);
                console.log("dest heatmap added!");
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else if ($('input.checkview')[3].checked) {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                addLayer(tmLayer);
                addLayer();
                console.log("zipcode checkbox checked!");
                console.log($(this).attr("value"));
                sel_boundary = $(this).attr("value");
                console.log("boundary selected: " + sel_boundary);
                sel_args.boundary = sel_boundary;
                requestBoundaryData(sel_args, zipLayer, addLayer);

            } else if ($('input.checkview')[4].checked) {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                addLayer(tmLayer);
                //addLayer("sep_bounds.geojson");
                console.log("sep checkbox checked!");
                console.log($(this).attr("value"));
                sel_boundary = $(this).attr("value");
                console.log("boundary selected: " + sel_boundary);
                sel_args.boundary = sel_boundary;
                requestBoundaryData(sel_args, sepLayer, addLayer);
            } else {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                addLayer(tmLayer);
                console.log("taz checkbox checked!");
                console.log($(this).attr("value"));
                sel_boundary = $(this).attr("value");
                console.log("boundary selected: " + sel_boundary);
                sel_args.boundary = sel_boundary;
                requestBoundaryData(sel_args);
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
        //requestBoundaryData(sel_args, sepLayer, addLayer);
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



