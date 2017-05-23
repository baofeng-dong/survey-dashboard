//functions for map.js
//add different maps based on the map view box selected
function addMapview () {
        //if point map selected
        if ($('input.checkview')[0].checked) {
            rebuild(sel_args);
            if (sel_args.rte && sel_args.dir) {
                rebuildPath(sel_args);
            }
        } else if ($('input.checkview')[1].checked || $('input.checkview')[2].checked){
            //clear layers
            removeLayers(mymap);
            buildHeatmap(sel_args, addOriginHeatMap, addDestHeatMap);
        } else if ($('input.checkview')[4].checked) {
            requestBoundaryData(sel_args, sepLayer, addLayer);
        }
}

//remove layers
function removeLayers(map) { 
    map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer == false) {
            map.removeLayer(layer);
            //console.log("removed layer!");
            //console.log(layer._leaflet_id);
        }
    })
} 

//clear all points and path layers
function resetLayers() {
    origMarkersLayer.clearLayers();
    destMarkersLayer.clearLayers();
    odPairLayerGroup.clearLayers();
    boundaryLayer.clearLayers();
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

//function to add geojson layer to map
function addLayer(geojson) {
    //console.log(geojson);
    var path = base + 'static/geojson/';

    $.getJSON(path + geojson, function(data) {
        console.log(data);
        boundary = L.geoJson(data, {
            style: switchStyle(geojson),
            onEachFeature: switchFeature(geojson)
        }).addTo(boundaryLayer);
        //console.log(boundary);

        boundaryLayer.addTo(mymap);
        boundaryLayer.bringToFront();
        console.log(geojson + " added to mymap!");
    })
}

//function to zoom to a sep area
function zoomToFeature(e) {
    mymap.fitBounds(e.target.getBounds());
}

//function to pick a style based on boundary layer
function switchStyle(geojson) {
    if (geojson == tmLayer) {
        return style
    } else if (geojson == sepLayer){
        return sepStyle
    } else {
        return zipStyle
    }
}

//style function
function style(feature) {
    console.log(feature);
    return {
        color: "#909090",
        weight: 2.0,
        opacity: 0.8,
        fillOpacity: 0.0
    } 
}

//style for sep
function sepStyle(feature){
    return {
        fillColor: getBdyColor(sep_dict[feature.properties.label1]),
        weight: 2.0,
        opacity: 0.8,
        color: 'white',
        fillOpacity: 0.7
    }
}

//style for zipcode
function zipStyle(feature){
    return {
        color: getBdyColor(),
        weight: 2.0,
        opacity: 0.8,
        fillOpacity: 0.6
    }
}

//function to highlight layer when a mouse hovers over
function highlightFeature(e) {
    var layer = e.target;
    console.log(layer.feature.properties.label1);
    var dest_sep = layer.feature.properties.label1;
    sel_args.dest_sep = dest_sep;
    requestBoundaryData(sel_args, sepLayer, addLayer);

    //layer.openPopup();

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

//reset style on mouseout
function resetHighlight(e) {
    var layer = e.target;
    boundary.resetStyle(layer);
    //layer.closePopup();

}

//switch on each feature based on boundary layer
function switchFeature(geojson) {
    if (geojson == sepLayer) {
        return onEachFeatureSep
    } else if (geojson == zipLayer){
        return onEachFeatureZip
    } else {
        return
    }
}

//alert function
function showAlert() {
    alert("hello!");
}
//use onEachFeature option to add listeners on sep layers
function onEachFeatureSep(feature, layer) {
    var popupContent = "<b>SEP:</b> " + feature.properties.label1;
    layer.bindPopup(popupContent);
    console.log(feature.properties.label1);
    var label = L.marker(layer.getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'label',
        html: feature.properties.label1,
        iconSize: [100, 40],
        color: 'black'
      })
    }).addTo(mymap);

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function onEachFeatureZip(feature, layer) {
    //var popupContent = "<b>SEP:</b> " + feature.properties.label1;
    //layer.bindPopup(popupContent);

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
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
    //addLabel();
}

//function to send query to map/_data to return boundary summary data
function requestBoundaryData(args, geojson, callback) {

    console.log(args);

    $.getJSON('map/_data', args, function(data) {

        console.log(data);
        data = data.data;
        console.log(data);

        buildDict(data, 'sep');
        console.log(sep_dict);

        if(callback) {
            callback(geojson);
        }

    });
    addMapLabel();
}

//function to loop through an array and build a dictionary
function buildDict(array,args) {
    len = array.length;
    //clear sep_dict
    sep_dict = {};
    for (var i = 0; i < len; i++) {
        if (args == 'sep') {
            key = array[i]["sep"];
            value = array[i]["percentage"];
            console.log(key, ' ', value);
            sep_dict[key] = value;
        }
    }
    return sep_dict;
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

//add label to map
function addMapLabel() {
    if(hasLegend) {
        return
    }

    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 5, 10, 20, 30, 40, 50, 60],
        labels = [];
        //labels = [(title.bold()).fontsize(3)],
        //from, to;

    // loop through our density intervals and generate a label with a colored square for each interval
    /*for (var i = 0; i < grades.length; i++) {
        from = grades [i];
        to = grades[i+1]-1;

    labels.push(
        '<i style="background:' + getLongColor(from + 1) + '"></i> ' +
        from + (to ? '&ndash;' + to : '+'));
        }
        div.innerHTML = labels.join('<br>');
        return div;*/
    for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
        '<i style="background:' + getBdyColor(grades[i] + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
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

function getBdyColor(pct) {
    return  pct > 60 ? '#d73027' :
            pct > 50 ? '#f46d43' :
            pct > 40 ? '#fdae61' :
            pct > 30 ? '#fee08b' :
            pct > 20 ? '#d9ef8b' :
            pct > 10 ? '#a6d96a' :
            pct > 5  ? '#66bd63' :
                       '#1a9850';
}