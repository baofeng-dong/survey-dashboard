
//build table using JSON data in jquery
function build_table(data,tb_id){

    var table = $(tb_id)
    console.log(table)
    $(".data-row").empty()
    for(var i = 0;i < data.length; i++){
        console.log(data[i]);
        var row = $("<tr>",{class: "data-row"});
        for(var j = 0; j < data[i].length; j++){
            var cell = $("<td>", {align:"center",valign:"middle"}).text(data[i][j]);
            console.log(data[i][j])
            row.append(cell)
        }
        table.append(row)
    }
}

//append a svg file based on selected question num to div-id: line-chart

function append_img(div_id, args){
    var div = $(div_id);
    console.log(args);
    var date = args['date'];
    console.log('date: ' + date)
    div.empty().prepend('<object data='+ base + 'static/image/' + 'surveyors-' + date + '.svg?' + Math.random() + ' type="image/svg+xml" width="100%" />');
}

    function rebuild_users(url, args) {
        $.getJSON(url, args, function(data) {
            console.log(data);
            var data = data.data;
            console.log(data);
            div_id = "#surveyors";
            div_id_ln = "#line-chart"
            tb_id = div_id + "-table";
            build_table(data,tb_id);
            append_img(div_id_ln,args);
            $(div_id).show();
            $("#line-chart").show();
        });
    }
 

function reset(){
    $("#surveyors").hide();
    $("#line-chart").hide();
}

// function to pick a date
    function get_date(today) {
        if(!today) today = new Date();
        var dd = today.getDate();
        console.log(dd);
        var mm = today.getMonth()+1; //January is 0!
        console.log(mm);
        var yyyy = today.getFullYear();
        console.log(yyyy);

        if(dd < 10) {
            dd='0'+dd
        } 
        if(mm < 10) {
            mm='0'+mm
        } 
        return yyyy + '-' + mm + '-' + dd;
    }
    
    var url = "surveyors/_summary";

    $("#date-select").val(get_date());

    rebuild_users(url, {'date':get_date()});

    $("#date-select").datepicker({
        dateFormat: "yy-mm-dd",
        autoclose:true,
        onSelect: function(sel_date, dp) {
            console.log("selected date");
            console.log(sel_date);
            reset();
            rebuild_users(url, {'date':sel_date});
        }
    });