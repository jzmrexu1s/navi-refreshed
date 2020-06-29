var ss;
var times = [];

// Texts to send
var time_text = [];
var routes_text = [];
var names_text = [];

var routes = [];
var renders = [];
var seq = [];
var selected_route = 0;
var prevPick;


var tableColumns = [
    {field: 'id', title: '地点名称'},
    {field: 'time', title: '持续时间（分钟）'},
];

var display = [];

var displayStatus = false;

// Define map
var map = new AMap.Map('container', {
    resizeEnable: true, //是否监控地图容器尺寸变化
    zoom:16, //初始化地图层级
    center: [116.4817881, 39.874614] });

// Information of markers
var coordinates = [];
var titles = [];
var special = [];
var markers = [];

// Style of markers
var normalIcon = new AMap.Icon({
    size: new AMap.Size(25, 34),
    image: "http://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png",
});
var selectedIcon = new AMap.Icon({
    size: new AMap.Size(25, 34),
    image: "http://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png",
});

// Dynamic window size
window.onload=function()
{
    var h=document.documentElement.clientHeight;
    ss=document.getElementById('abc');
    ss.style.height=h+"px";
};

// Date and time pickers
date = new Date();
date.setTime(date.getTime());
$(function () {
    $('#datetimepicker1').datetimepicker({
        format: 'HH:mm',
        initialDate: date,
    });
});
$(function () {
    $('#datetimepicker2').datetimepicker({
        initialDate: date,
    });
});
$(function () {
    $('#datetimepicker3').datetimepicker({
        initialDate: date,
    });
});

Date.prototype.clone = function(){
    return new Date(this.valueOf());
};

// Style of chart
function rowStyle(row, index) {
    var style = {};
    style={css:{
            'color':'#ffffff'
        }};
    return style;
}

// Coordinates settings
for (var i = 0; i < coordinates.length; i += 1) {
    var marker;
    marker = new AMap.Marker({
        position: coordinates[i],
        title: i,
        icon: normalIcon,
        map: map,
    });
    content = [];
    content.push("简介：" + titles[i]);
    content.push("电话：6739 3456");
    if (special.indexOf(titles[i]) !== -1) {
        content.push("<a href='http://www.bjut.edu.cn/' class='custom-link'>点击此处访问网址</a>");
        content.push("<button type='button' class='btn btn-success' data-toggle='modal' data-target='#myModal'>立即订票</button>");
    }
    marker.content = content;
    infoWindow = new AMap.InfoWindow({
        isCustom: true,
        content: null,
        offset: new AMap.Pixel(16, -45)
    });
    marker.on('mouseover', infoOpen);
    marker.on('click', handleClickPos);
    markers.push(marker);
}

AMapUI.loadUI(['misc/PoiPicker'], function(PoiPicker) {

    var poiPicker = new PoiPicker({
        //city:'北京',
        input: 'pickerInput'
    });

    //初始化poiPicker
    poiPickerReady(poiPicker);
});

function poiPickerReady(poiPicker) {
    window.poiPicker = poiPicker;
    //选取了某个POI
    poiPicker.on('poiPicked', function(poiResult) {

        var marker = new AMap.Marker();
        if (prevPick) {
            map.remove(prevPick);
        }
        var infoWindow = new AMap.InfoWindow({
            offset: new AMap.Pixel(0, -20)
        });

        var poi = poiResult.item;

        marker.setPosition(poi.location);
        marker.setTitle(poi.name)
        infoWindow.setPosition(poi.location);

        marker.setMap(map);
        infoWindow.setMap(map);

        map.setCenter(poi.location);

        var content = poi.name + '<br>' + poi.address + '<br>' + '点击坐标点以添加';
        infoWindow.setContent(content);
        marker.on('click', handleClickPos);
        // infoWindow.open(map, marker.getPosition());
        prevPick = marker;
    });
}

function search() {
    if($("#datetimepicker1").find("input").val() === '') {
        return;
    }
    var start_time = $("#datetimepicker1").find("input").val();
    start_time = start_time.split(':');
    var start_t = new Date(2019, 11, 4, start_time[0], start_time[1], 0);
    var walking = new AMap.Walking({
    });
    routes = new Array(display.length * display.length);
    var timeSeq = new Array(display.length * display.length);
    times = new Array(display.length * 2);
    times[0] = start_t.clone();
    times[1] = start_t.clone();
    for (var i = 0; i < display.length; i ++) {
        for (var j = 0; j < display.length; j ++) {
            (function (i, j) {
                walking.search(display[i]['loc'], display[j]['loc'], function (status, result) {
                    routes[i * display.length + j] = result;
                    // console.log(result);
                    timeSeq[i * display.length + j] = result['routes']['0']['time'];
                })
            })(i, j);
        }
    }
    setTimeout(function () {
        $.ajax({
            cache: false,
            type: "POST",
            dataType:'json',
            data: {"timeSeq": JSON.stringify(timeSeq)},
            url: "http://127.0.0.1:5000/getseq",
            async: false,
            crossDomain: true,
            traditional: true,
            success: function (data) {
                displayStatus = true;
                seq = JSON.parse(data['seq']);
                renders = new Array(seq.length - 1);
                for (var i = 0; i < seq.length - 1; i ++) {
                    render = new Lib.AMap.WalkingRender();
                    render.autoRender({
                        data: routes[(seq[i] - 1) * display.length + (seq[i + 1] - 1)],
                        map: map,
                    });
                    renders[i] = render;
                }
                var k = 2;
                for (var j = 1; j < seq.length - 1; j += 1) {
                    var t = times[k - 1].clone();
                    var t_s = t.getTime();
                    t.setTime(t_s + timeSeq[(seq[j - 1] - 1) * display.length + (seq[j] - 1)] * 1000);
                    times[k] = t.clone();
                    t_s = t.getTime();
                    t.setTime(t_s + display[(seq[j] - 1)]['time'] * 60 * 1000);
                    times[k + 1] = t.clone();
                    k = k + 2;
                }
                var t = times[k - 1].clone();
                var t_s = t.getTime();
                t.setTime(t_s + timeSeq[(seq[seq.length - 2] - 1) * display.length + (seq[seq.length - 1] - 1)] * 1000);
                times[1] = t.clone();

                for (var i = 0; i < times.length; i += 1) {
                    times[i] = times[i].toLocaleTimeString();
                }

                for (var i = 0; i < display.length; i += 1) {
                    if (i === 0) {
                        time_text.push("出发：" + times[i * 2] + " 结束：" + times[i * 2 + 1]);
                        for (var j = 0; j < markers.length; j += 1) {
                            if (markers[j].getTitle() === display[seq[i] - 1]['id']) {
                                markers[j].setLabel({
                                        content: "<div class='labelContent'>" + "出发：" + times[i * 2] + " 结束：" + times[i * 2 + 1] + "</div>",
                                        offset: new AMap.Pixel(-50,-28)}
                                )
                            }
                        }
                    } else {
                        time_text.push("停留：" + times[i * 2] + " ~ " + times[i * 2 + 1]);
                        for (var j = 0; j < markers.length; j += 1) {
                            if (markers[j].getTitle() === display[seq[i] - 1]['id']) {
                                markers[j].setLabel({
                                    content: "<div class='labelContent'>" + "停留：" + times[i * 2] + " ~ " + times[i * 2 + 1] + "</div>",
                                    offset: new AMap.Pixel(-50,-28)}
                                )
                            }
                        }
                    }
                }

            }
        })
    }, 5000);
}

$(function () {
    $('#searchbutton').click(function (event) {
        search();
    });
});

$(function () {
    $('#bookbutton').click(function (event) {
        search();
    });
});

$(function () {
    $('#addbutton').click(function (event) {
        console.log('test');
    });
});


$(function () {
    $('#sendbutton').click(function (event) {
        routes_text = [];
        names_text = [];
        for (var i = 0; i < seq.length - 1; i++) {
            var r = routes[(seq[i] - 1) * display.length + (seq[i + 1] - 1)]["routes"]["0"]["steps"];
            var temp = [];
            var j = 0;
            while (j < r.length) {
                temp.push(r[String(j)]["instruction"]);
                j += 1;
            }
            routes_text.push(temp);
        }
        for (var i = 0; i < seq.length; i++) {
            names_text.push(display[seq[i] - 1]["id"]);
        }
        var email = $("#inputemail").val();
        // console.log(email);
        $.ajax({
            cache: false,
            type: "POST",
            dataType: 'json',
            data: {
                "time": JSON.stringify(time_text),
                "routes": JSON.stringify(routes_text),
                "names": JSON.stringify(names_text),
                "email": email
            },
            url: "http://127.0.0.1:5000/mail",
            async: false,
            crossDomain: true,
            traditional: true,
        });
    })
});

$(function () {
    $('#clearbutton').click(function (event) {
        for (var i = 0; i < seq.length - 1; i ++) {
            renders[i].clear();
        }
        renders = [];
        routes = [];
        seq = [];
        selected_route = 0;
        display = [];
        times = [];
        time_text = [];
        routes_text = [];
        names_text = [];
        $('#tableL01').bootstrapTable('destroy');
        map.remove(markers);
        markers = [];
        displayStatus = false;
    });
});

$(function () {
    $('#cleardisplaybutton').click(function (event) {
        cleardisplay();
    });
});

$(function () {
    $('#allroute').click(function (event) {
        for (var i = 0; i < seq.length - 1; i ++) {
            renders[i].clear();
        }
        for (var i = 0; i < seq.length - 1; i ++) {
            renders[i].autoRender({
                data: routes[(seq[i] - 1) * display.length + (seq[i + 1] - 1)],
                map: map,
            });
        }
    });
});

$(function () {
    $('#leftroute').click(function (event) {
        for (var i = 0; i < seq.length - 1; i ++) {
            renders[i].clear();
        }
        if (selected_route > 0) {
            selected_route -= 1;
        }
        renders[selected_route].autoRender({
            data: routes[(seq[selected_route] - 1) * display.length + (seq[selected_route + 1] - 1)],
            map: map,
            panel: "panel"
        });
    });
});

$(function () {
    $('#rightroute').click(function (event) {
        for (var i = 0; i < seq.length - 1; i ++) {
            renders[i].clear();
        }
        if (selected_route < seq.length - 2) {
            selected_route += 1;
        }
        renders[selected_route].autoRender({
            data: routes[(seq[selected_route] - 1) * display.length + (seq[selected_route + 1] - 1)],
            map: map,
            panel: "panel"
        });
    });
});

function cleardisplay() {
    for (var i = 0; i < seq.length - 1; i ++) {
        renders[i].clear();
    }
    renders = [];
    routes = [];
    seq = [];
    selected_route = 0;
    time_text = [];
    routes_text = [];
    names_text = [];
    displayStatus = false;
    for (var i = 0; i < markers.length; i ++) {
        markers[i].setLabel(null);
    }
}

function createInfoWindow(title, content) {
    var info = document.createElement("div");
    info.className = "custom-info input-card content-window-card";

    //可以通过下面的方式修改自定义窗体的宽高
    //info.style.width = "400px";
    // 定义顶部标题
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("img");
    top.className = "info-top";
    titleD.innerHTML = title;
    closeX.src = "https://webapi.amap.com/images/close2.gif";
    closeX.onclick = infoClose;

    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);

    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    bottom.style.position = 'relative';
    bottom.style.top = '0px';
    bottom.style.margin = '0 auto';
    var sharp = document.createElement("img");
    sharp.src = "https://webapi.amap.com/images/sharp.png";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}

function handleClickPos(e){
    console.log(e);
    infoClose();
    if (displayStatus === true) {
        cleardisplay();
    }
    prevPick = null;
    var t = e.target.getTitle();
    var flg = 0;
    for (var j = 0; j < display.length; j ++) {
        if (display[j]['id'] === t) {
            display.splice(j, 1);
            flg = 1;
            for (var k = 0; k < markers.length; k ++) {
                if (markers[k].getTitle() === t) {
                    map.remove(markers[k]);
                    markers.splice(k, 1);
                }
            }
            $('#tableL01').bootstrapTable('destroy');
            $('#tableL01').bootstrapTable({
                theadClasses: "thead-light",
                rowStyle: rowStyle,
                columns: tableColumns,
                data: display,
                clickEdit: true,
                onClickCell: function(field, value, row, $element) {
                    if (field === 'time') {
                        $element.attr('contenteditable', true);
                        $element.blur(function() {
                            let index = $element.parent().data('index');
                            let tdValue = parseInt($element.html());
                            saveData(index, field, tdValue);
                        })
                    }
                }
            });
        }
        if (display.length === 0) {
            $('#tableL01').bootstrapTable('destroy');
        }
    }

    if (flg === 0 && display.length < 10) {
        markers.push(e.target);
        e.target.setIcon(selectedIcon);
        display.push({id: e.target.getTitle(), time: 30, loc: e.target.getPosition()});
        $('#tableL01').bootstrapTable('destroy');
        $('#tableL01').bootstrapTable({
            theadClasses: "thead-light",
            rowStyle: rowStyle,
            columns: tableColumns,
            data: display,
            clickEdit: true,
            onClickCell: function(field, value, row, $element) {
                if (field === 'time') {
                    $element.attr('contenteditable', true);
                    $element.blur(function() {
                        let index = $element.parent().data('index');
                        let tdValue = parseInt($element.html());
                        if (!isNaN(tdValue) && tdValue > 0) {
                            saveData(index, field, tdValue);
                        }
                        else {
                            saveData(index, field, 30);
                        }
                    })
                }
            }
        });
    }
}

function saveData(index, field, value) {
    $('#tableL01').bootstrapTable('updateCell', {
        index: index,       //行索引
        field: field,       //列名
        value: value        //cell值
    });
}

function infoClose() {
    map.clearInfoWindow();
}

map.setFitView();
