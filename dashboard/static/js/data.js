    //set when a route, direction or user is selected from dropdowns
    var sel_line = '';
    var sel_dir = '';
    var sel_user = '';
    var dir_lookup = {};

    $(directions).each(function(index, item) {
        if(!dir_lookup.hasOwnProperty(item.rte_desc)) {
            dir_lookup[item.rte_desc] = {};
        }
        dir_lookup[item.rte_desc][item.dir] = item.dir_desc;
    });


    function rebuild(args) {
        console.log(args);
        $.getJSON('data/_query', args, function(data) {
            if(args['csv'] == true) {
                console.log(data.data);
                download("data.csv", data.data);
            }
            else {
                //clear table and rebuild with fetched json
                console.log(data);
                $("#tbody").empty();
                $(data.data).each(function(index, item) {
                    var date = '<td>'+item.date+'</td>';
                    var time = '<td>'+item.time+'</td>';
                    var user = '<td>'+item.user+'</td>';
                    var line = '<td>'+item.rte_desc+'</td>';
                    var dir = '<td>'+item.dir_desc+'</td>';
                    var satisfaction = '<td>'+item.satisfaction+'</td>';
                    var comments = '<td>'+item.comments+'</td>';
                    var row = '<tr>'+date+time+user+line+dir+satisfaction+comments+'</tr>';
                    $("#tbody").append(row);
                });
            }
        });
    }

    //build table on initial page load with no filter params
    rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir, 'user':sel_user});

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
        rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir, 'user':sel_user});
    });

    $('#filter_dir a').on('click', function() {
        sel_dir = this.text;
        $("#dir_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        if (sel_dir == 'All') sel_dir = '';
        rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir, 'user':sel_user});
    });


    $('#filter_user a').on('click', function() {
        sel_user = this.text;
        $("#user_btn").text(this.text+' ').append('<span class="caret"></span>');
        if (sel_user == 'All') sel_user = '';
        rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir, 'user':sel_user});
    });


    function download(filename, text) {
        var a = document.createElement("a");
        a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(text);
        a.download = filename;
        
        a.target - "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    $("#generate-btn").on('click', function(a) {
        rebuild({'rte_desc':sel_line, 'dir_desc':sel_dir, 'csv':true, 'user':sel_user});
    });