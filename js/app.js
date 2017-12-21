//百度地图API功能
/*function loadJScript() {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = "http://api.map.baidu.com/api?v=2.0&ak=ED5ebc91fe41f85878c57e54f68b6fae&callback=init";
            document.body.appendChild(script);
    var srcs = [
        // "http://api.map.baidu.com/api?v=2.0&ak=ED5ebc91fe41f85878c57e54f68b6fae",
        // "http://api.map.baidu.com/api?libraries=DrawingManager&v=1.4",
        // "http://api.map.baidu.com/library/DrawingManager/1.4/src/DrawingManager_min.js",
        // "http://api.map.baidu.com/library/SearchInfoWindow/1.4/src/SearchInfoWindow_min.js"
        "http://api.map.baidu.com/api?libraries=DrawingManager, SearchInfoWindow&ak=ED5ebc91fe41f85878c57e54f68b6fae&callback=init"
    ];
    srcs.forEach(function(src) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = src;
        // script.async = "async";
        document.body.appendChild(script);
    });
}*/

function init() {
    // 定义标记
    var map = new BMap.Map("map", {
        enableMapClick: false
    }); // 创建Map实例,关闭地图POI事件，底图可点功能
    map.enableScrollWheelZoom(); //启用滚轮放大缩小
    var point = new BMap.Point(104.122743, 30.615385); // 创建点坐标
    map.centerAndZoom(point, 17); //地图中心定位到标注点

    // 添加全景显示区域
    // map.addTileLayer(new BMap.PanoramaCoverageLayer());
    var markers = [];
    // 一系列坐标点
    var locations = [{
        point: [104.126372, 30.615447],
        address: "川师北门",
        info: "川师图书馆"
    }, {
        point: [104.121234, 30.614017],
        address: "川师南门",
        info: "雅俊商务酒店"
    }, {
        point: [104.122419, 30.61293],
        address: "川师北门",
        info: "城东雅君"
    }, {
        point: [104.1263, 30.612184],
        address: "川师南门校园广场",
        info: "大嘴霸王排骨"
    }, {
        point: [104.121449, 30.617187],
        address: "川师南门",
        info: "中国银行"
    }];
    // 信息窗口展示样式
    var opts = {
        width: 300,
        height: 200,
        title: "",
        enableMessage: true
        // message: "最近的地铁站"
    };
    // 循环添加
    locations.forEach(function(location) {
        var point = new BMap.Point(location.point[0], location.point[1]);
        var marker = new BMap.Marker(point);
        var content = `<img src="http://api.map.baidu.com/staticimage/v2?ak=ED5ebc91fe41f85878c57e54f68b6fae&mcode=666666&center=${location.point[0]},${location.point[1]}&width=300&height=200&zoom=19" />`;
        // console.log(content);
        // 默认设置隐藏，但是仍有动画视觉残留，及标记阴影（代码执行顺序无关）        
        // 若想要执行效果更好，在此先不将marker添加到地图，再设置按钮添加
        // show(), hide() 显示/隐藏， addOverlay(overlay),remove(overlay) 添加/删除
        // marker.hide();
        // 添加点击处理事件
        addClickHandler(content, marker);
        // 给 marker 设定动画样式，这里添加的动画没有什么效果，需要添加在 显示/隐藏/添加/删除中
        // marker.setAnimation(BMAP_ANIMATION_DROP);
        // 添加点击事件：点击显示放大静态地图
        marker.addEventListener('click', function(e) {
            console.log(this.isVisible());
            openInfo(content, e);
        });
        // 建立，但不显示，放入 标记点集合
        markers.push(marker);
        // 在地图上添加 marker
        // map.addOverlay(marker);
        // 添加鼠标悬停变色
        /*            marker.addEventListener('mouseover', function() {
                        // 设置图标图形样式
                        var myIcon = new BMap.Icon("http://lbsyun.baidu.com/jsdemo/img/fox.gif", new BMap.Size(300,157));
                    // var marker = new BMap.Marker(new BMap.Point(location.point[0], location.point[1]), {icon:myIcon});
                        this.setIcon(myIcon);
                    });
                    marker.addEventListener('mouseout', function() {
                        // 设置图标图形样式
                        var defaultIcon = new BMap.Icon("http://api0.map.bdimg.com/images/blank.gif", new BMap.Size(100,100));
                    // var marker = new BMap.Marker(new BMap.Point(location.point[0], location.point[1]), {icon:myIcon});
                        this.setIcon(defaultIcon);
                    })*/
        // 添加全景显示（效果不佳）
        /*            var panorama = new BMap.Panorama("map");
                    panorama.setPov({heading: -40, pitch: 6});
                    marker.addEventListener('click', function() {
                        // console.log(panorama);
                        panorama.setPosition(point);
                    })*/
    });

    var drawingManager = new BMapLib.DrawingManager(map, {
        isOpen: true,
        drawingType: BMAP_DRAWING_MARKER,
        enableDrawingTool: true,
        enableCalculate: true,
        drawingToolOptions: {
            anchor: BMAP_ANCHOR_TOP_RIGHT,
            offset: new BMap.Size(5, 5),
            drawingTypes: [
                // BMAP_DRAWING_MARKER,
                // BMAP_DRAWING_POLYLINE,
                // BMAP_DRAWING_POLYGON,
                // 由于百度searchInfo API 仅能搜索 圆和矩形
                BMAP_DRAWING_CIRCLE,
                BMAP_DRAWING_RECTANGLE
            ],
            drawingModes: [
                BMAP_DRAWING_MARKER,
                BMAP_DRAWING_CIRCLE,
                BMAP_DRAWING_POLYGON
            ]
        },
        polylineOptions: {
            strokeColor: "#333"
        }
    });
    // 设置多边形变量
    var polygon = null;
    // drawingManager.open();
    // 获取覆盖物
    var drawings = [];
    var overlayComplete = function(e) {
        // console.log(e);
        drawings.push(e.overlay);
    };

    function addClickHandler(content, marker) {
        marker.addEventListener('click', function(e) {
            openInfo(content, e);
        });
    }

    function openInfo(content, e) {
        var p = e.target;
        var point = new BMap.Point(p.getPosition().lng, p.getPosition().lat);
        var infowindow = new BMap.InfoWindow(content, opts);
        map.openInfoWindow(infowindow, point);
    }
    // 添加/删除标记点列表
    function addListings() {
        markers.forEach(function(marker) {
            map.addOverlay(marker);
            marker.setAnimation(BMAP_ANIMATION_DROP);
        });
    }

    function removeListings() {
        markers.forEach(function(marker) {
            map.removeOverlay(marker);
        });
    }
    // 显示/隐藏标记点列表
    function showListings() {
        markers.map(function(marker) {
            // 添加动画坐标点动画,跳动 BMAP_ANIMATION_BOUNCE, 掉落BMAP_ANIMATION_DROP
            // 显示marker
            marker.show();
            marker.setAnimation(BMAP_ANIMATION_BOUNCE);
        });
    }

    function hideListings() {
        // map.clearOverlays();
        markers.map(function(marker) {
            marker.hide();
        });
    }
    // 清楚所有覆盖物，物理意义上的清楚，show(), hide() 将不在作用
    function clearOverlays() {
        map.clearOverlays();
    }

    /*    function toggleDrawing(drawingManager) {
                    if (drawingManager._isOpen) {
                        that.value = "Open Drawing";
                        drawingManager.close();
                    } else {
                        that.value = "close Drawing";
                        drawingManager.open();
                    }

            if (drawingManager._opts.enableDrawingTool) {
                drawingManager._opts.enableDrawingTool = false;
                map.removeControl(drawingManager);
            } else {
                drawingManager._opts.enableDrawingTool = true;
                map.addControl(drawingManager);
            }
        }*/
    // 显示绘图数量
    function countDrawings() {
        var drawingsCount = document.getElementById('drawings');
        drawingsCount.innerText = drawings.length;
    }
    // 绑定事件
    document.getElementById('add-listings').addEventListener('click', addListings);
    document.getElementById('remove-listings').addEventListener('click', removeListings);
    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', hideListings);
    // 给绘图管理绑定事件
    // drawingManager.addEventListener('overlaycomplete', overlayComplete);
    // Add an event listener so that the polygon is captured, call the searchingWithinPolygon function.
    // This will show the markers in the polygon, and hide any outside of it.
    drawingManager.addEventListener('overlaycomplete', function(e) {
        // 获取绘图对象 e 的overlay 就是 覆盖物属性值 有 marker circle polygon polyline rectangle
        // 获取绘图对象 e 的 label  就是 它的计算结果
        if (e.drawingMode === 'circle') {
            // console.log(e.overlay.getCenter());
            // e.overlay.enableEditing();
            // console.log(e.label.point);
            // var marker = new BMap.Marker(e.label.point);
            // map.addOverlay(marker);
            // 添加计数
            // var count = 0;
            markers.forEach(function(marker) {
                // 检查标注是否在在图形内，封装一个芳芳 inShowOutHide(ckecked, marker);
                /*if (BMapLib.GeoUtils.isPointInCircle(marker.getPosition(), e.overlay)) {
                    count++;
                } else {
                    marker.hide();
                }*/
                inShowOutHide(BMapLib.GeoUtils.isPointInCircle(marker.getPosition(), e.overlay), marker);
            });
            // console.log(count);
        } else if (e.drawingMode === 'marker') {
            // console.log(e.overlay.getPosition());
            console.log(e.overlay);
        } else if (e.drawingMode === 'polygon') {
            // var count = 0;
            markers.forEach(function(marker) {
                // 检查标注是否在在图形内
                /*if (BMapLib.GeoUtils.isPointInPolygon(marker.getPosition(), e.overlay)) {
                    count++;
                } else {
                    marker.hide();
                }*/
                inShowOutHide(BMapLib.GeoUtils.isPointInPolygon(marker.getPosition(), e.overlay), marker);
            });
            // console.log(count);
        }
        // 在图形内的标注marker显示，外部的隐藏
        function inShowOutHide(ckecked, marker) {
            if (ckecked) {
                marker.show();
            } else {
                marker.hide();
            }
        }
        /*else if (e.drawingMode === 'marker') {
            console.log(e);
        }
        console.log(drawingManager.getDrawingMode());*/
        /*        if (polygon) {
                    hideListings();
                }*/
        // 设置当前绘制模式，点线面
        // drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        // polygon = e.overlay;
        // google map function 设置图形可编辑
        // polygon.setEditable(true);
        // baidu map function 设置图形可编辑，设置后，需要点击工具 手指，进行编辑, 然并卵，毫不智能的工具，设定marker
        // polygon.enableEditing()
        // Searching within the polygon.
        // searchingWithinPolygon();
        // Make sure the search is re-done if the poly is changed.
        // polygon.getPath().addListener('set_at', searchingWithinPolygon);
        // polygon.getPath().addListener('insert_at', searchingWithinPolygon);
    });
    document.getElementById('drawing-count').addEventListener('click', countDrawings);
    // 清除所有覆盖物
    document.getElementById('clear-drawings').addEventListener('click', function() {
        drawings.forEach(function(drawing) {
            map.removeOverlay(drawing);
        });
        drawings.length = 0;
        countDrawings();
    });

    /*        var marker = new BMap.Marker(point); //创建标注
            map.addOverlay(marker); //将标注添加到地图
            var infowindow = new BMap.InfoWindow("地址：", opts); //创建窗口信息对象
            marker.addEventListener('click', function() {  //创建监听事件
                map.openInfoWindow(infowindow, point);  //开启信息窗口
            });*/
}
window.onload = init; //异步加载地图