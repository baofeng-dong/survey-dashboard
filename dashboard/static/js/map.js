
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
        origMarkersLayer.clearLayers();
        destMarkersLayer.clearLayers();

        console.log(args);
        $.getJSON('map/_query', args, function(data) {

            //retrive origin and destination lat and lng
            // and add the marker to mymap
            console.log(data);

            $(data.data).each(function(index, item) {
                // origin lat and long
                var o_lat = item.o_lat;
                console.log("o_lat: " + o_lat);
                var o_lng = item.o_lng;
                console.log("o_lng: " + o_lng);
                // destination lat and long
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

                // add origin marker to mymap
                var orig_marker = L.marker([o_lat,o_lng], {
                    clickable: true
                }).bindPopup(orig_popup, {showOnMouseOver:true});
                origMarkersLayer.addLayer(orig_marker);
                origMarkersLayer.addTo(mymap);

                // add destination marker to mymap
                var dest_marker = L.marker([d_lat,d_lng], {
                    clickable: true
                }).bindPopup(dest_popup, {showOnMouseOver:true});
                destMarkersLayer.addLayer(dest_marker);
                destMarkersLayer.addTo(mymap);
            });

        });
    }

    //build table on initial page load with no filter params
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
