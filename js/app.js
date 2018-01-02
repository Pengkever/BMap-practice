/*
 * 步骤：
 *    1、建立一个ViewModel,一部分控制menu
 *    2、另一部分控制map
 *
 * 2017-12-30 已完成：
 * 1、地图载入
 * 2、实时监控输入字符来筛选列表
 * 3、点击列表筛选列表(有bug，点击列表长度为0，需要还原列表currentResults)
 * 明日任务：
 * 1、地图标记
 * 2、点击地图标注显示窗口
 * 3、点击列表筛选标注
 * 4、第三方API 详细信息
 * 5、添加信息窗口
 *
 */

 $(function() {
    const ViewModel = function() {
        // 将 this 赋予 self 方便调用
        const self = this;
        // 百度API密钥
        const BDAK = 'ED5ebc91fe41f85878c57e54f68b6fae';
        // 初始数据，
        // 城市列表
        self.cities = ['北京', '上海', '广州', '杭州', '成都'];
        // 项目列表
        self.params = ['餐厅', '酒吧', '景点', '大学']
        // 当前选择中
        self.selectCity = ko.observable(self.cities[4]);
        self.selectParam = ko.observable(self.params[3]);


        // 初始化地图函数
        self.initMap = function() {
            const map = new BMap.Map('map');
            map.centerAndZoom(self.selectCity(), 13);
            map.enableScrollWheelZoom();

            return map;
        };
        
        // 获取地图
        const cityMap = self.initMap();

        // 添加事件函数，当城市改变时，地图中心设置为当前城市
        self.choose = function() {
            cityMap.centerAndZoom(self.selectCity(), 13);
            // 清空上一次数据
            self.results([]);
            // 移除标注
            self.removeMarkers(cityMap);
            // 还原页码
            self.pageNum = 0;
            // 获取新的数据
            self.getDataFromBMap();
            // 获取天气
            self.getCityWeather();
        };
        // 是否显示list-box
        self.isShowListBox = ko.observable(true);
        // 从百度地图API获取数据
        // 数据存放数组
        self.results = ko.observableArray();

        // page_num 页数
        self.pageNum = 0;
        // 是否没有更多数据判断依据
        self.isEndResults = ko.observable(false);
        // 更多数据按钮text
        self.getMoreButtonText = ko.computed(function() {
            return self.isEndResults()? '已经到尾了': '加载更多';
        });
        self.getDataFromBMap = function() {
            $.ajax({
                url: 'http://api.map.baidu.com/place/v2/search',
                type: 'GET',
                dataType: 'jsonp',
                timeout: '3000',
                contentType: 'application/json; utf-8',
                data: {
                    query: self.selectParam(),
                    region: self.selectCity(),
                    output: 'json',
                    ak: BDAK,
                    page_num: self.pageNum++ 
                },
                success: function(data) {
                    console.log('success');
                    // 没有更多数据，就返回true
                    if (data.results.length === 0) return self.isEndResults(true);
                    // 获取更多数据
                    // 暂存当前数数
                    let tempResult = self.results();
                    // 连接新旧数据
                    tempResult = tempResult.concat(data.results);
                    // 更新数据
                    self.results(tempResult);
                    // 添加标注到地图 
                    self.addDataToMap(cityMap);
                },
                error: function(e) {
                    console.error('Error: ' + e.message);
                }
            });
        };

        // 存储地图标注
        self.markers = ko.observableArray();;
        // 给地图添加标注及信息窗口
        self.addDataToMap = function(map) {
            for (const result of self.currentResults()) {
                const point = new BMap.Point(result.location.lng, result.location.lat);
                const marker = new BMap.Marker(point);
                
                // 在地图上显示marker
                map.addOverlay(marker);
                
                 // 设置 marker 的title ，通过 getTtile() 方法获取
                marker.setTitle(`${result.name}`);
                // 添加 marker 的入场动画
                marker.setAnimation(BMAP_ANIMATION_DROP);

                // 将标注 marker 放入 markers
                self.markers.push(marker);

                // 给标注添加地址信息
                marker.address = `${result.address}`;

                // 获取地址详细信息
                self.getPlaceDetail(result.uid, map, marker);
            }
        };
        

        // 筛选列表
        // 获取输入内容
        self.keywordsString = ko.observable('');
        // 临时results
        self.currentResults = ko.computed(function() {
            // 去除输入内容前后空格
            const keywordsString = $.trim(self.keywordsString());
            // 如果没有输入或者都是空格,直接返回self.results;
            if (keywordsString.length === 0) return self.results();
            const keywordsArray = keywordsString.split(' ');
            
            // 第一层循环遍历 results
            // 建立一个list 存放筛选后的数据
            // 检查 字符串 中是否含有 关键字
            function hasKeywords(checkedStr, keywordStr) {
                // 检查两个传参的数据类型
                if (typeof checkedStr !== 'string') {
                    console.error('Error: the type of checkedStr must be string');
                    return;
                }
                if (typeof keywordStr !== 'string') {
                    console.error('Error: the type of keywordStr param must be string');
                    return;
                }
                return checkedStr.includes(keywordStr);
            }

            const list = [];
            for(const item of self.results()) {
                // 
                let flag = false;
                // 检查获取的数据中name 和 address 是否为字符串类型的数据
                if (typeof item.name !== 'string' || typeof item.address !== 'string') {
                    console.error(`Error: the data of item.name or item.address isn't typeof string`);
                    return;
                }

                for(const keyword of keywordsArray) {
                    // 如果 keyword 为空字符串，不用检测
                    if (keyword.length) {
                        if (!(hasKeywords((item.name + item.address), keyword))) {
                        // 只要内容中不含有某一关键词 即可跳出循环，不必进行后面运算
                            flag = true;                            
                            break;
                        }
                    }
                }

                // 根据flag 决定是否加入list
                if (!flag) list.push(item);
            }            
            // 返回列表
            return list;
        });
        // 获取点击时的信息
        self.currentItem = ko.observable(null);
        self.listClick = function(item) {
            // 设置当前输入框内容为点击目标 name
            self.keywordsString(item.name);
            // 隐藏列表
            self.isShowListBox(false);
            // 获取当前点击目标
            self.currentItem(item);
            // 隐藏其他标注
            self.clickShow(item);
        };
        self.back = function() {
            // 清空搜索框内容
            self.keywordsString('');
            // 显示列表
            self.isShowListBox(true);
            // 清楚标注动画效果
            self.clearAnimation();
            // 关闭所有信息窗口
            self.closeInfoWindow();
            // 显示所有 marker
            self.showMarkers();
        };
        // 获取第三方信息
        // 界面是否显示天气信息
        self.isShowWeather = ko.observable(false);
        self.toggleWeather = function() {
            // 点击改变
            self.isShowWeather(!self.isShowWeather());
        };
        // 绑定天气数据
        self.weather = ko.observable();
        // 获取天气信息
        self.getCityWeather = function() {
            // 中文转换拼音
            const cityList = {
                '北京': 'beijing',
                '上海': 'shanghai',
                '广州': 'guangzhou',
                '杭州': 'hangzhou',
                '成都': 'chengdu'
            };
            // 转换当前城市中文为拼音
            let cityName = cityList[self.selectCity()];

            // 根据cityid获取城市天气
            function getWeather(cityid) {
                $.ajax({
                    url: 'http://weixin.jirengu.com/weather/now',
                    type: 'GET',
                    data: {
                        cityid: cityid
                    },
                    success: function(data) {
                        console.log('success');
                        self.weather(data.weather[0]);
                        // 改变
                        self.toggleWeather(!self.toggleWeather());
                    },
                    error: function(e) {
                        console.error(e.message);
                    }
                });
            }
            // 获取当前城市id
            $.ajax({
                url: 'http://weixin.jirengu.com/weather/cityid',
                type: 'GET',
                data: {
                    location: cityName                    
                },
                success: function(data) {
                    console.log('success');
                    // 成功获取id后获取天气
                    getWeather(data.results[0].id);
                },
                error: function(e) {
                    console.error(e);
                }
            });
        };

        // 获取地点详情
        self.getPlaceDetail = function(uid, map, marker) {
            $.ajax({
                url: 'http://api.map.baidu.com/place/v2/detail',
                type: 'GET',
                dataType: 'jsonp',
                timeout: '3000',
                contentType: 'application/json; utf-8',
                data: {
                    uid: uid,
                    output: 'json',
                    scope: 2,
                    ak: BDAK
                },
                success: function(data) {
                    // console.log('success', data);
                    // 设置信息窗口内容
                    const content = `<div>地址：${data.result.address}</div>
                                     <div>标签：${data.result.detail_info.tag}</div>
                                     <a target="_blank" href="${data.result.detail_info.detail_url}">更多详情</a>`;
                    self.addClickHandler(map, content, marker);
                },
                error: function(e) {
                    console.error(e.message);
                    const content = `<div>没有更多信息</div>`;
                    self.addClickHandler(map, content, marker);
                }
            });
        };

        // 添加地图点击事件
        self.addClickHandler = function(map, content, marker) {
            marker.addEventListener('click', function(e) {
                // 将所有marker的动画效果清空
                self.clearAnimation();
                // 添加跳动动画
                marker.setAnimation(BMAP_ANIMATION_BOUNCE);
                // 显示信息窗口
                self.openInfo(map, content, e.target);
            });
        };
        self.searchInfoWindows = ko.observableArray();
        // 打开信息窗口
        self.openInfo = function(map, content, marker) {
            // 设置信息窗口的内容
            function searchInfoWindowOptions(marker) {
                return {
                    title: marker.getTitle(), //标题
                    width: 290, //宽度
                    height: 50, //高度
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
            const searchInfoWindow = new BMapLib.SearchInfoWindow(map, content, searchInfoWindowOptions(marker));
            // 放入窗口组中
            self.searchInfoWindows.push(searchInfoWindow);
            // 打开窗口
            searchInfoWindow.open(marker);
        };

        // 关闭动画
        self.clearAnimation = function() {
            for(const marker of self.markers()) {
                marker.setAnimation(null);
            }
        };
        // 关闭信息窗口
        self.closeInfoWindow = function() {
            for (const searchInfoWindow of self.searchInfoWindows()) {
                searchInfoWindow.close();
            }
        };
        // 隐藏所有 marker
        self.hideMarkers = function() {
            for (const marker of self.markers()) {
                marker.hide();
            }
        };
        // 移除所有 marker
        self.removeMarkers = function(map) {
            for (const marker of self.markers()) {
                map.removeOverlay(marker);
            }
        };
        // 显示当前对应 marker
        self.clickShow = function(item) {
            for (const marker of self.markers()) {
                if (marker.getTitle() !== item.name) {
                    marker.hide();
                }
            }
        };
        // 鼠标移入
        self.mouseoverItem = function(item) {
            for (const marker of self.markers()) {
                // 找到符合条件marker 即可退出循环
                if (marker.getTitle() === item.name) {
                    marker.setAnimation(BMAP_ANIMATION_BOUNCE);
                    break;
                }
            }
        };
        // 鼠标移出
        self.mouseoutItem = function() {
            self.clearAnimation();
        };

        // 是否显示 菜单
        self.isShowMenu = ko.observable(true);

        self.toggleMenu = function() {
            self.isShowMenu(!self.isShowMenu());
        };

        self.init = function() {

            // 获取天气信息
            self.getCityWeather();

            // 获取数据
            self.getDataFromBMap();

            // 监控浏览器窗口变化，600为临界点
            $(window).resize(function() {
                // 获取当前body宽度:document.body.scrollWidth
                // 比较当前宽度和最大宽度
                // 是否显示 菜单
                self.isShowMenu(document.body.scrollWidth > 600);
            });

            // 添加标注到地图
            // self.addDataToMap(cityMap);
        };
        self.init()
    };
    const viewModel = new ViewModel();
    ko.applyBindings(viewModel);
 });