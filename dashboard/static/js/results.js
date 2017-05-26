var sel_ques = null;
var sel_line = '';
var sel_dir = '';
var dir_lookup = {};

var sel_args = {
    qnum : "",
    vehicle: "",
    day : "",
    tod : "",
    rte : "",
    dir : "",
    travel: "",
    satisfaction: ""
    }

//function for expanding/collapsing div content

function toggle_tb(div_id_tb){
    var div = $(div_id_tb);
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

//append a svg file based on selected question num to div-id: line-chart

function append_img(div_id){
    var div = $(div_id);
    var qnum = questionkey[sel_ques]
    div.empty().prepend('<object data='+ base + 'static/image/' + 'q' + qnum + '.svg?' + Math.random() + ' type="image/svg+xml" width="100%" />');
}

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
            //console.log(cell);
            console.log(data[i][j])
            row.append(cell)
        }
        table.append(row)
    }
}



var questionkey = buildkey(questions);

for (var key in questionkey){
    var val = questionkey[key];
    console.log("Key: "+key+" Value:"+val);
}

//builds reference questionkey list
function buildkey(questions){
    var questionkey = {};
    for (var i = 0; i < questions.length; i++){
        questionkey[questions[i][1]] = questions[i][0];
    }

    return questionkey
}


var routeskey = buildkey(routes);

for (var key in routeskey){
    var val = routeskey[key];
    console.log("Key: "+key+" Value:"+val);
}

//builds reference routeskey list
function buildkey(routes){
    var routeskey = {};
    for (var i = 0; i < routes.length; i++){
        routeskey[routes[i][1]] = routes[i][0];
    }
    return routeskey
}


function reset(){
    $("#line-chart").hide();
    $("#button-header").hide();
    $("#toggle").attr('value','Hide');
    $("#satisfaction").hide();
    $("#origin").hide();
    $("#destination").hide();
    $("#travelchange").hide();
    $("#gasoline").hide();
    $("#ridership").hide();
    $("#rideyears").hide();
    $("#approval").hide();
    $("#onechange").hide();
    $("#age").hide();
    $("#gender").hide();
    $("#race").hide();
    $("#transit").hide();
    $("#vehicle").hide();
    $("#house").hide();
    $("#vecount").hide();
    $("#income").hide();
}

//set when a route, direction or user is selected from dropdowns
$(directions).each(function(index, item) {
    //console.log(directions);
    if(!dir_lookup.hasOwnProperty(item.rte)) {
        dir_lookup[item.rte] = [null, null];
    }
    dir_lookup[item.rte][item.dir] = item;

});

//console.log(dir_lookup);

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
    requestdata();
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
    requestdata();
});


$('#filter_ques a').on('click', function() {
    reset();
    sel_ques = this.text
    console.log(sel_ques)
    console.log(questionkey[sel_ques])
    var qnum = questionkey[sel_ques];
    //var args = {"qnum":(questionkey[sel_ques])};
    sel_args.qnum = questionkey[sel_ques];
    console.log("qnum: " + qnum)
    $("#ques_btn").text(this.text+' ').append('<span class="caret"></span>');
    requestdata();

});


$('#filter_day a').on('click', function() {
    reset();
    var sel_day = this.text
    console.log("day selected: " + sel_day)
    if (sel_day == 'All') {
        sel_args.day = null;
    }
    else {
    sel_args.day = sel_day;
    }
    $("#day_btn").text(this.text+' ').append('<span class="caret"></span>');
    requestdata();

});


$('#filter_vehicle a').on('click', function() {
    reset();
    var sel_vehicle = this.text
    console.log("vehicle selected: " + sel_vehicle)
    if (sel_vehicle == 'All') {
        sel_args.vehicle = null;
    }
    else {
    sel_args.vehicle = sel_vehicle;
    }
    $("#vehicle_btn").text(this.text+' ').append('<span class="caret"></span>');
    requestdata();

});

$('#filter_travel a').on('click', function() {
    reset();
    var sel_travel = this.text
    console.log("travel change selected: " + sel_travel)
    if (sel_travel == 'All') {
        sel_args.travel = null;
    }
    else {
    sel_args.travel = sel_travel;
    }
    $("#travel_btn").text(this.text+' ').append('<span class="caret"></span>');
    requestdata();

});


$('#filter_tod a').on('click', function() {
    reset();
    var sel_tod = this.text
    console.log("time of day selected: " + sel_tod)
    if (sel_tod == 'All') {
        sel_args.tod = null;
    }
    else {
    sel_args.tod = sel_tod;
    }
    $("#tod_btn").text(this.text+' ').append('<span class="caret"></span>');
    requestdata();

});


/*$('#filter_fpl a').on('click', function() {
    reset();
    var sel_fpl = this.text
    console.log("fpl selected: " + sel_fpl)
    if (sel_fpl == 'All') {
        sel_args.fpl = null;
    }
    else {
    sel_args.fpl = sel_fpl;
    }
    $("#fpl_btn").text(this.text+' ').append('<span class="caret"></span>');
    requestdata();

});*/

function requestdata() {
    $.getJSON('/results/_data', sel_args, function(data) {
        console.log(data);
        div_id_ln = "#line-chart"
        div_id = "#" + data.metadata.id
        tb_id = div_id + "-table"
        data = data.data;

        build_table(data,tb_id);
        append_img(div_id_ln);
        toggle_tb(div_id);
        $(div_id).show();
        $("#line-chart").show();
        $("#button-header").show();


    });

}
