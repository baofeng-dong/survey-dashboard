
//initialize map 


$(document).ready(function() {
    mymap = L.map('mapid', {scrollWheelZoom:true}).setView([45.48661, -122.65343], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG11c2VyMTk3IiwiYSI6ImNpc254cHk1YTA1dngydm14bjkyamQ1NmsifQ.8ya7T1hHXtVmYOwMrVIuFw', {
    attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>',
    id: 'mapbox.light',
    maxZoom: 18,
    minZoom: 11
    }).addTo(mymap);

})

    //set when a route, direction or user is selected from dropdowns
    var sel_line = '';
    var sel_dir = '';
    var dir_lookup = {};
    // creates layers for orig and dest markers
    var origMarkersLayer = new L.LayerGroup();
    var destMarkersLayer = new L.LayerGroup();

    $(directions).each(function(index, item) {
        if(!dir_lookup.hasOwnProperty(item.rte_desc)) {
            dir_lookup[item.rte_desc] = {};
        }
        dir_lookup[item.rte_desc][item.dir] = item.dir_desc;
    });


    function rebuild(args) {
        //clear previous orig and dest markers
        origMarkersLayer.clearLayers();
        destMarkersLayer.clearLayers();

        console.log(args);

        $.getJSON('map/_query', args, function(data) {

            //retrive origin and destination lat and lng

            console.log(data);

            $(data.data).each(function(index, item) {
                // get origin lat and long from data.data json
                var o_lat = item.o_lat;
                console.log("o_lat: " + o_lat);
                var o_lng = item.o_lng;
                console.log("o_lng: " + o_lng);
                // get destination lat and long
                var d_lat = item.d_lat;
                console.log("d_lat: " + d_lat);
                var d_lng = item.d_lng;
                console.log("d_lng: " + d_lng);

                // defines popup content for orig markers
                var orig_popup = L.popup().setLatLng([o_lat,o_lng]).setContent(
                    "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                    "<b>Direction:</b>" + " " + item.dir_desc + '<br />' +
                    "<b>Origin Type:</b>" + " " + item.o_type);

                // defines popup content for destination markers
                var dest_popup = L.popup().setLatLng([d_lat,d_lng]).setContent(
                    "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                    "<b>Direction:</b>" + " " + item.dir_desc + '<br />' +
                    "<b>Destination Type:</b>" + " " + item.d_type);


                // add origin marker to origMarkersLayer
                var olatlng = L.latLng([o_lat,o_lng]);

                var orig_marker = L.circleMarker(olatlng, {
                    clickable: true,
                    fillColor: "#259CEF",
                    radius: 10,
                    weight: 1,
                    opacity: 0.2,
                    fillOpacity: 0.6
                }).bindPopup(orig_popup, {showOnMouseOver:true});

                origMarkersLayer.addLayer(orig_marker);

                // add origMarkersLayer to mymap
                origMarkersLayer.addTo(mymap);

                // add destination marker to mymap
                var dlatlng = L.latLng([d_lat,d_lng]);

                var dest_marker = L.circleMarker(dlatlng, {
                    clickable: true,
                    fillColor: "#4BF01B",
                    radius: 10,
                    weight: 1,
                    opacity: 0.2,
                    fillOpacity: 0.6
                }).bindPopup(dest_popup, {showOnMouseOver:true});

                destMarkersLayer.addLayer(dest_marker);
                // add destMarkersLayer to mymap
                destMarkersLayer.addTo(mymap);
            });

        });
    }

    //load map with markers on initial page load with no filter params
    rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir});

    $('#filter_line a').on('click', function() {
        sel_line = this.text
        sel_dir = '';
        $("#line_btn").text(this.text+' ').append('<span class="caret"></span>');

        if (this.text == "All") {
            //resert direction
            //hide direction dropdown
            $(".direction_cls").hide();
        }
        else {
            //update direction dropdown with correct names
            var dir = dir_lookup[this.text];
            $("#outbound_link").text(dir[0]+' ').show();
            $("#inbound_link").text(dir[1]+' ').show();
            $(".direction_cls").show();
        }
        
        $("#dir_btn").text('All ').append('<span class="caret"></span>');
        
        if (sel_line == 'All') sel_line = '';
        rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir});
    });

    $('#filter_dir a').on('click', function() {
        sel_dir = this.text;
        $("#dir_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        if (sel_dir == 'All') sel_dir = '';
        rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir});
    });

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
