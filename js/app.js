// 思路变化：将查询 q url 变成参数 更加人性化
// 步骤： 载入，加载 左侧html 和 初始化的 map
//        然后 获取数据，再绑定 ViewModel
// 但是加载 左侧html时就有 data-bind 没有绑定 ViewModel 绑定会报错
// 经测试，没有绑定 没有new 对象时，不会报错
// 分离map 独立map对象
// 初始化数据 使用ajax
$(function() {

    function load(content, city) {
        // 检查传入的内容和城市名非空
        if (typeof content !== 'string' ||
            typeof city !== 'string' ||
            content.length === 0 ||
            city.length === 0)
            return console.error(`Iuput not incorrect,This should be string and not null`);

        // 初始化函数
        function initialData() {
            // 返回信息状态
            function isResults(data) {
                if (data.status !== 0) {
                    return showError(data.message)
                }
                var viewModel = new ViewModel(data.results);
                ko.applyBindings(viewModel);
            }
            // 显示错误信息
            function showError(message) {
                var viewmodel = {
                    hasData: ko.observable(false),
                    errorMessage: ko.observable(message)
                };
                ko.applyBindings(viewmodel);
            }
            // 从百度api 获取 数据
            $.ajax({
                url: 'http://api.map.baidu.com/place/v2/search',
                type: 'GET',
                dataType: 'jsonp',
                timeout: '5000',
                contentType: 'application/json;utf-8',
                data: {
                    query: content,
                    region: city,
                    output: 'json',
                    ak: 'ED5ebc91fe41f85878c57e54f68b6fae',
                },
                success: function(data) {
                    console.log('success');
                    return isResults(data);
                },
                error: function(error) {
                    console.error('error: ', error);
                }
            });
        }
        // 模型
        var ViewModel = function(arr) {
            // 初始化地图，中心为成都市，缩放等级13，鼠标滚动缩放开启。
            var map = new BMap.Map("map");
            map.centerAndZoom(city, 13);
            map.enableScrollWheelZoom();

            // 声明 markers 数组来存储，地图上添加的 marker
            // 不用 传递进来的 arr ，1、是为了同意后期调用 2、arr数据保持不变性
            var markers = [];
            arr.forEach(function(item) {
                // 百度地图api  Point对象 lng 经度在先，lat 纬度在后,
                // marker.getPosition() 返回的顺序 同Point
                // 否则引起 Uncaught TypeError: b.ga(...).nb is not a function  at HTMLSpanElement.eval  
                //(eval at zZ (getscript?v=2.0&ak=CBb579132…&services=&t=20170411141812:1), <anonymous>:1:1279)
                // console.log(item.location); 通过获取的数据的location顺序是 lat 在先
                var point = new BMap.Point(item.location.lng, item.location.lat);
                var marker = new BMap.Marker(point);
                // 添加 marker 到地图， 
                map.addOverlay(marker);
                // 设置 marker 的title ，通过 getTtile() 方法获取
                marker.setTitle(`${item.name}, ${item.address}`);
                // 添加 marker 的入场动画
                marker.setAnimation(BMAP_ANIMATION_DROP);
                // 添加鼠标点击显示内容
                addClickHandler(marker.getTitle(), marker);
                // 添加 marker 到 markers 数组
                markers.push(marker);
            });

            // 给 marker 添加点击事件
            function addClickHandler(content, marker) {
                marker.addEventListener('click', function(e) {
                    // 将所有marker的动画效果清空
                    clearAnimation();
                    // 添加跳动动画
                    marker.setAnimation(BMAP_ANIMATION_BOUNCE);
                    // 显示信息窗口
                    openInfo(content, e);
                });
            }

            // 显示信息窗口函数
            function openInfo(content, e) {

                // 获取点击目标
                var marker = e.target;

                // 返回信息窗口的设置
                function searchInfoWindowOptions(marker) {
                    return {
                        title: marker.getTitle(), //标题
                        width: 290, //宽度
                        height: 105, //高度
                        panel: "panel", //检索结果面板
                        enableAutoPan: true, //自动平移
                        searchTypes: [
                            BMAPLIB_TAB_SEARCH, //周边检索
                            BMAPLIB_TAB_TO_HERE, //到这里去
                            BMAPLIB_TAB_FROM_HERE //从这里出发
                        ]
                    };
                }

                // 建立含检索功能的窗体
                searchInfoWindow = new BMapLib.SearchInfoWindow(map, content, searchInfoWindowOptions(marker));

                // 打开窗口
                searchInfoWindow.open(marker);
            }

            // 清除动画效果
            function clearAnimation() {
                if (!markers) return;
                markers.forEach(function(marker) {
                    marker.setAnimation(null);
                });
            }

            // 将 this 赋值给 self 方便后面代码调用
            // 因为 this 的灵活性，会导致对象不明
            var self = this;

            // 设定 hasData 来表示 错误信息
            this.hasData = ko.observable(true);

            // 要牢记，经过 ko.observable()捕获的任何事物都变成了方法（函数），
            // 需要（）执行后方可获得其值

            // 绑定
            this.header = ko.observable(city);
            this.title = ko.observable(content);
            // 搜索框值
            this.q = ko.observable('');

            // list 绑定为实时监控且双向绑定的对象
            // 通过搭配模板中的 textInput 
            // 每当 input 输入框中内容变化，list 随之而变
            this.list = ko.computed(function() {
                // 输入时，取消动画效果
                clearAnimation();
                // 关闭infoWindow
                map.closeInfoWindow();
                // 去除输入内容前后的空格
                var keywordsString = $.trim(self.q());
                // 将查询内容分割（单个空格）成关键字数组
                // 更加智能的情况下 应该去除各类字符后 形成关键字数组
                var keywordsArray = keywordsString.split(' ');
                var list = [];
                // 遍历所有 标注点
                markers.forEach(function(marker) {
                    // 定义检测变量 flag
                    var flag = true;
                    // 遍历所有 关键字
                    keywordsArray.forEach(function(keyword) {
                        // 非空的关键字比对
                        if (keyword.length !== 0) {
                            // 一旦不含 marker.getTitle() 中不含关键字
                            // 即刻将flag变为false，且返回，后续不用比较，降低比较次数
                            if (!(marker.getTitle().includes(keyword))) {
                                return flag = false;
                            }
                        }
                    });
                    // 根据检测变量 flag 确定 marker 是否该隐藏和加入数组list中
                    if (flag) {
                        marker.show();
                        list.push(marker);
                    } else {
                        marker.hide();
                    }
                });
                return list;
            });
            // 点击列表中的任一项目，使得输入框内的值等于点击项目
            // 同时隐藏列表，显示点击项目的单体信息
            this.currentItem = ko.observable(null);
            // 控制是否显示的属性
            this.toggle = ko.observable(true);
            this.clickItem = function(item) {
                if (!item) return;
                self.currentItem(item.getTitle());
                // 将地图中心设置为当前标注点
                map.centerAndZoom(item.getPosition(), 15);
                self.toggle(false);
                self.q(item.getTitle());
            };
            this.mouseoverItem = function(item) {
                item.setAnimation(BMAP_ANIMATION_BOUNCE);
            };
            this.mouseoutItem = function() {
                clearAnimation();
            };
            // 清除动作
            this.clearQueryInput = function() {
                // 移除动画
                clearAnimation();
                // 关闭信息窗口
                map.closeInfoWindow();
                // 还原地图中心
                map.centerAndZoom(city, 13);
                // 改变显示参考值
                self.toggle(true);
                self.q('');
            };
            // 查询当前网页正文宽度
            this.bodyScrollWidth = ko.observable(document.body.scrollWidth);
            this.bodyMax = ko.observable(700);
            // 按钮内容和判断依据都应该是计算过的
            // 根据网页正文宽度计算
            this.comparedWith = function(width, max) {
                if (width < max) {
                    return true;
                } else {
                    return false;
                }
            };
            // 查询列表 left 值的判断依据
            this.isShowMenu = ko.observable(!self.comparedWith(self.bodyScrollWidth(), self.bodyMax()));
            // 点击按钮执行显示查询列表
            this.toggleMenu = function() {
                // 改变isShowMenu的为相反
                self.isShowMenu(!self.isShowMenu());
            };
        };
        // 执行
        initialData();
    };
    load('火锅', '成都');
});