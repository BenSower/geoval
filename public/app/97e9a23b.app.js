"use strict";angular.module("geovalApp",["ngCookies","ngResource","ngSanitize","ui.router","ui.bootstrap","openlayers-directive","angular-ladda","ui.bootstrap-slider","tableSort","nvd3ChartDirectives"]).config(["$stateProvider","$urlRouterProvider","$locationProvider","$httpProvider",function(a,b,c,d){b.otherwise("/"),c.html5Mode(!0),d.interceptors.push("authInterceptor")}]).factory("authInterceptor",["$rootScope","$q","$cookieStore","$location",function(a,b,c,d){return{request:function(a){return a.headers=a.headers||{},c.get("token")&&(a.headers.Authorization="Bearer "+c.get("token")),a},responseError:function(a){return 401===a.status?(d.path("/login"),c.remove("token"),b.reject(a)):b.reject(a)}}}]).run(["$rootScope","$location","Auth",function(a,b,c){a.$on("$stateChangeStart",function(a,d){c.isLoggedInAsync(function(a){d.authenticate&&!a&&b.path("/login")})})}]),angular.module("geovalApp").config(["$stateProvider",function(a){a.state("login",{url:"/login",templateUrl:"app/account/login/login.html",controller:"LoginCtrl"}).state("signup",{url:"/signup",templateUrl:"app/account/signup/signup.html",controller:"SignupCtrl"}).state("settings",{url:"/settings",templateUrl:"app/account/settings/settings.html",controller:"SettingsCtrl",authenticate:!0})}]),angular.module("geovalApp").controller("LoginCtrl",["$scope","Auth","$location",function(a,b,c){a.user={},a.errors={},a.login=function(d){a.submitted=!0,d.$valid&&b.login({email:a.user.email,password:a.user.password}).then(function(){c.path("/")})["catch"](function(b){a.errors.other=b.message})}}]),angular.module("geovalApp").controller("SettingsCtrl",["$scope","User","Auth",function(a,b,c){a.errors={},a.changePassword=function(b){a.submitted=!0,b.$valid&&c.changePassword(a.user.oldPassword,a.user.newPassword).then(function(){a.message="Password successfully changed."})["catch"](function(){b.password.$setValidity("mongoose",!1),a.errors.other="Incorrect password",a.message=""})}}]),angular.module("geovalApp").controller("SignupCtrl",["$scope","Auth","$location",function(a,b,c){a.user={},a.errors={},a.register=function(d){a.submitted=!0,d.$valid&&b.createUser({name:a.user.name,email:a.user.email,password:a.user.password}).then(function(){c.path("/")})["catch"](function(b){b=b.data,a.errors={},angular.forEach(b.errors,function(b,c){d[c].$setValidity("mongoose",!1),a.errors[c]=b.message})})}}]),angular.module("geovalApp").controller("AdminCtrl",["$scope","$http","$timeout","Auth","User",function(a,b,c,d,e){$("#input-1a").fileinput({uploadUrl:"/api/trajectories/gpx",uploadAsync:!0,allowedFileExtensions:["gpx"],browseClass:"btn btn-md btn-default",maxFileCount:10}),a.users=e.query(),a.mediaq="Import MediaQ Trajectories",a.clearDbLabel="Delete all Trajectories from Db",a.importMediaQ=function(){a.isImportingMediaq=!0,$.getJSON("/api/trajectories/importMediaQ",function(b){a.mediaq="Imported "+b.importedVideos+" trajectories",c(function(){a.isImportingMediaq=!1},0)})},a.clearDb=function(){a.isDroppingTrajectories=!0,$.ajax({url:"/api/trajectories/",type:"DELETE",success:function(){a.clearDbLabel="Deleted all trajectories",c(function(){a.isDroppingTrajectories=!1},0)}})}}]),angular.module("geovalApp").config(["$stateProvider",function(a){a.state("admin",{url:"/admin",templateUrl:"app/admin/admin.html",controller:"AdminCtrl"})}]),angular.module("geovalApp").controller("AnalysisCtrl",["$scope","$http",function(a,b){b.get("/api/trajectories").success(function(b){a.rawTrajectories=b,a.scatterData=c(b),a.donutData=d(a.scatterData)}),a.showTable=!1;var c=function(a){for(var b={},c=0;c<a.length;c++){var d=a[c];for(var e in d.properties.distribution)void 0===b[e]?b[e]=d.properties.distribution[e]:b[e]+=d.properties.distribution[e]}var f=[];for(var g in b)f.push({key:"Group "+g,values:[{x:g,y:b[g],size:b[g]}]});return f},d=function(a){var b=[],c={key:"Others",y:0};for(var d in a){var e=a[d],f=e.values[0].y;b.push({key:e.key,y:f})}return b.push(c),b};a.xFunction=function(){return function(a){return console.log(a.key),a.key}},a.yFunction=function(){return function(a){return a.y}},a.descriptionFunction=function(){return function(a){return a.key}}}]),angular.module("geovalApp").config(["$stateProvider",function(a){a.state("analysis",{url:"/analysis",templateUrl:"app/analysis/analysis.html",controller:"AnalysisCtrl"})}]),angular.module("geovalApp").controller("MainCtrl",function(){}),angular.module("geovalApp").config(["$stateProvider",function(a){a.state("main",{url:"/",templateUrl:"app/main/main.html",controller:"MainCtrl"})}]),angular.module("geovalApp").controller("MapCtrl",["$scope","$http",function(a,b){function c(b){var c=g(b);return a.layers[1].source.geojson.object.features=c,a.sliderOptions.renderedTrajectories=c.length,d(c),c}function d(b){h=[],a.markers=[];for(var c=0;c<b.length;c++){var d=b[c],f=e(d.id,".mov")?"iOs":"Android";if(d.geometry.coordinates[0]){var g="<h5>"+d.id+"</h5>Coordinates: "+d.geometry.coordinates.length+"<br/> Outlier Threshold: "+d.properties.outlierThreshold+"m<br/> Device: "+f,i={name:d.id,lat:d.geometry.coordinates[0][1],lon:d.geometry.coordinates[0][0],label:{message:g,show:!1,showOnMouseOver:!0}};h.push(i)}else console.log("this trajectory has no correct coordinates:",d)}a.toggleMarkers()}function e(a,b){return-1!==a.indexOf(b,a.length-b.length)}function f(b){var c=a.sliderOptions.thresholdValue;return b.properties.outlierThreshold>c||b.geometry.coordinates.length<a.sliderOptions.trajectoryLengthConstraint?null:b}function g(a){for(var b=[],c=0;c<a.length;c++){var d=f(a[c]);null!==d&&b.push(d)}return console.log(b.length),b}var h=[],i=new ol.style.Style({stroke:new ol.style.Stroke({color:"#123456",width:1})}),j=new ol.style.Style({stroke:new ol.style.Stroke({color:"#FF0000",width:5})});angular.extend(a,{markers:[],center:{lat:48.13650696913464,lon:11.606172461258842,zoom:12,autodiscover:!1,bounds:[]},layers:[{name:"main",source:{type:"OSM"}},{name:"trajectories",source:{type:"GeoJSON",geojson:{object:{type:"FeatureCollection",features:[]},projection:"EPSG:3857"}},style:i}],defaults:{events:{layers:["mousemove"],map:["singleclick"]},interactions:{mouseWheelZoom:!0}},customTrajectory:[],projection:"EPSG:4326"});var k;a.onStopSlide=function(){c(a.rawTrajectories)},a.sliderOptions={min:10,max:1e3,step:10,orientation:"horizontal",handle:"round",tooltip:"hide",tooltipsplit:!1,enabled:!0,naturalarrowkeys:!1,range:!1,ngDisabled:!1,reversed:!1,loadedTrajectories:0,renderedTrajectories:0,trajectoryLengthConstraint:50,thresholdValue:10},b.get("/api/trajectories").success(function(b){a.rawTrajectories=b,a.renderedTrajectories=c(b),a.sliderOptions.loadedTrajectories=b.length}),a.$on("openlayers.layers.trajectories.mousemove",function(b,c){a.$apply(function(){c!==k&&(k&&k.setStyle(i),c&&void 0!==c.getId()&&(c.setStyle(j),k=c))})}),a.$on("openlayers.map.singleclick",function(b,c){a.$apply(function(){if(a.projection===c.projection)a.customTrajectory=c.coord;else{var b=ol.proj.transform([c.coord[0],c.coord[1]],c.projection,a.projection);a.customTrajectory.push({lat:b[1],lon:b[0]})}})}),a.toggleMarkers=function(){a.markers.length>0?a.markers=[]:a.markers=h},a.clearTrajectory=function(){a.customTrajectory=[]}}]),angular.module("geovalApp").config(["$stateProvider",function(a){a.state("map",{url:"/map",templateUrl:"app/map/map.html",controller:"MapCtrl"})}]),angular.module("geovalApp").factory("Auth",["$location","$rootScope","$http","User","$cookieStore","$q",function(a,b,c,d,e,f){var g={};return e.get("token")&&(g=d.get()),{login:function(a,b){var h=b||angular.noop,i=f.defer();return c.post("/auth/local",{email:a.email,password:a.password}).success(function(a){return e.put("token",a.token),g=d.get(),i.resolve(a),h()}).error(function(a){return this.logout(),i.reject(a),h(a)}.bind(this)),i.promise},logout:function(){e.remove("token"),g={}},createUser:function(a,b){var c=b||angular.noop;return d.save(a,function(b){return e.put("token",b.token),g=d.get(),c(a)},function(a){return this.logout(),c(a)}.bind(this)).$promise},changePassword:function(a,b,c){var e=c||angular.noop;return d.changePassword({id:g._id},{oldPassword:a,newPassword:b},function(a){return e(a)},function(a){return e(a)}).$promise},getCurrentUser:function(){return g},isLoggedIn:function(){return g.hasOwnProperty("role")},isLoggedInAsync:function(a){g.hasOwnProperty("$promise")?g.$promise.then(function(){a(!0)})["catch"](function(){a(!1)}):a(g.hasOwnProperty("role")?!0:!1)},isAdmin:function(){return"admin"===g.role},getToken:function(){return e.get("token")}}}]),angular.module("geovalApp").factory("User",["$resource",function(a){return a("/api/users/:id/:controller",{id:"@_id"},{changePassword:{method:"PUT",params:{controller:"password"}},get:{method:"GET",params:{id:"me"}}})}]),angular.module("geovalApp").controller("FooterCtrl",["$scope",function(a){a.geovalVersion="v 1.0.0"}]),angular.module("geovalApp").factory("Modal",["$rootScope","$modal",function(a,b){function c(c,d){var e=a.$new();return c=c||{},d=d||"modal-default",angular.extend(e,c),b.open({templateUrl:"components/modal/modal.html",windowClass:d,scope:e})}return{confirm:{"delete":function(a){return a=a||angular.noop,function(){var b,d=Array.prototype.slice.call(arguments),e=d.shift();b=c({modal:{dismissable:!0,title:"Confirm Delete",html:"<p>Are you sure you want to delete <strong>"+e+"</strong> ?</p>",buttons:[{classes:"btn-danger",text:"Delete",click:function(a){b.close(a)}},{classes:"btn-default",text:"Cancel",click:function(a){b.dismiss(a)}}]}},"modal-danger"),b.result.then(function(b){a.apply(b,d)})}}}}}]),angular.module("geovalApp").directive("mongooseError",function(){return{restrict:"A",require:"ngModel",link:function(a,b,c,d){b.on("keydown",function(){return d.$setValidity("mongoose",!0)})}}}),angular.module("geovalApp").controller("NavbarCtrl",["$scope","$location","Auth",function(a,b,c){a.menu=[{title:"Home",link:"/"}],a.isCollapsed=!0,a.isLoggedIn=c.isLoggedIn,a.isAdmin=c.isAdmin,a.getCurrentUser=c.getCurrentUser,a.logout=function(){c.logout(),b.path("/login")},a.isActive=function(a){return a===b.path()}}]),angular.module("geovalApp").factory("socket",["socketFactory",function(a){var b=io("",{path:"/socket.io-client"}),c=a({ioSocket:b});return{socket:c,syncUpdates:function(a,b,d){d=d||angular.noop,c.on(a+":save",function(a){var c=_.find(b,{_id:a._id}),e=b.indexOf(c),f="created";c?(b.splice(e,1,a),f="updated"):b.push(a),d(f,a,b)}),c.on(a+":remove",function(a){var c="deleted";_.remove(b,{_id:a._id}),d(c,a,b)})},unsyncUpdates:function(a){c.removeAllListeners(a+":save"),c.removeAllListeners(a+":remove")}}}]),angular.module("geovalApp").run(["$templateCache",function(a){a.put("app/account/login/login.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><div class=container><div class=row><div class=col-sm-12><h1>Login</h1></div><div class=col-sm-12><form name=form ng-submit=login(form) novalidate class=form><div class=form-group><label>Email</label><input name=email ng-model=user.email class="form-control"></div><div class=form-group><label>Password</label><input type=password name=password ng-model=user.password class="form-control"></div><div class="form-group has-error"><p ng-show="form.email.$error.required &amp;&amp; form.password.$error.required &amp;&amp; submitted" class=help-block>Please enter your email and password.</p><p class=help-block>{{ errors.other }}</p></div><div><button type=submit class="btn btn-inverse btn-lg btn-login">Login</button> <a href=/signup class="btn btn-default btn-lg btn-register">Register</a></div></form></div></div><hr></div><div ng-include=&quot;components/footer/footer.html&quot;></div>'),a.put("app/account/settings/settings.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><div class=container><div class=row><div class=col-sm-12><h1>Change Password</h1></div><div class=col-sm-12><form name=form ng-submit=changePassword(form) novalidate class=form><div class=form-group><label>Current Password</label><input type=password name=password ng-model=user.oldPassword mongoose-error="" class="form-control"><p ng-show=form.password.$error.mongoose class=help-block>{{ errors.other }}</p></div><div class=form-group><label>New Password</label><input type=password name=newPassword ng-model=user.newPassword ng-minlength=3 required class="form-control"><p ng-show="(form.newPassword.$error.minlength || form.newPassword.$error.required) &amp;&amp; (form.newPassword.$dirty || submitted)" class=help-block>Password must be at least 3 characters.</p></div><p class=help-block>{{ message }}</p><button type=submit class="btn btn-lg btn-primary">Save changes</button></form></div></div></div><div ng-include=&quot;components/footer/footer.html&quot;></div>'),a.put("app/account/signup/signup.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><div class=container><div class=row><div class=col-sm-12><h1>Sign up</h1></div><div class=col-sm-12><form name=form ng-submit=register(form) novalidate class=form><div ng-class="{ &quot;has-success&quot;: form.name.$valid &amp;&amp; submitted,        &quot;has-error&quot;: form.name.$invalid &amp;&amp; submitted }" class=form-group><label>Name</label><input name=name ng-model=user.name required class="form-control"><p ng-show="form.name.$error.required &amp;&amp; submitted" class=help-block>A name is required</p></div><div ng-class="{ &quot;has-success&quot;: form.email.$valid &amp;&amp; submitted,        &quot;has-error&quot;: form.email.$invalid &amp;&amp; submitted }" class=form-group><label>Email</label><input type=email name=email ng-model=user.email required mongoose-error="" class="form-control"><p ng-show="form.email.$error.email &amp;&amp; submitted" class=help-block>Doesn\'t look like a valid email.</p><p ng-show="form.email.$error.required &amp;&amp; submitted" class=help-block>What\'s your email address?</p><p ng-show=form.email.$error.mongoose class=help-block>{{ errors.email }}</p></div><div ng-class="{ &quot;has-success&quot;: form.password.$valid &amp;&amp; submitted,        &quot;has-error&quot;: form.password.$invalid &amp;&amp; submitted }" class=form-group><label>Password</label><input type=password name=password ng-model=user.password ng-minlength=3 required mongoose-error="" class="form-control"><p ng-show="(form.password.$error.minlength || form.password.$error.required) &amp;&amp; submitted" class=help-block>Password must be at least 3 characters.</p><p ng-show=form.password.$error.mongoose class=help-block>{{ errors.password }}</p></div><div><button type=submit class="btn btn-inverse btn-lg btn-login">Sign up</button> <a href=/login class="btn btn-default btn-lg btn-register">Login</a></div></form></div></div><hr></div><div ng-include=&quot;components/footer/footer.html&quot;></div>'),a.put("app/admin/admin.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><div class=container><p><h4>Upload a gpx trajectory:</h4><input id=input-1a name=upload type=file multiple class="file"></p><div class=row><div class=col-md-6><p><h4>Import all video-trajectories from MediaQ:</h4><button ng-click=importMediaQ() ladda=isImportingMediaq data-style=zoom-out data-spinner-color=#123456 class="btn btn-md btn-default"><span class=ladda-label>{{mediaq}}</span></button></p></div><div class=col-md-6><p><h4>Delete all trajectories in db:</h4><button ng-click=clearDb() ladda=isDroppingTrajectories data-style=zoom-out data-spinner-color=#123456 class="btn btn-md btn-default"><span class=ladda-label>{{clearDbLabel}}</span></button></p></div></div><p>The delete user and user index api routes are restricted to users with the \'admin\' role.</p><ul class=list-group><li ng-repeat="user in users" class=list-group-item><strong>{{user.name}}</strong><br><span class=text-muted>{{user.email}}</span><a ng-click=delete(user) class=trash><span class="glyphicon glyphicon-trash pull-right"></span></a></li></ul></div><div ng-include=&quot;components/footer/footer.html&quot;></div>'),a.put("app/analysis/analysis.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><div ng-controller=AnalysisCtrl class=container><div class=container><nvd3-scatter-chart height=300 id=scatter data=scatterData tooltips=true interactive=true tooltipcontent=tooltipXContentFunction() shape=circle></nvd3-scatter-chart><nvd3-pie-chart data=donutData height=500 margin={left:0,top:0,bottom:0,right:0} x=xFunction() y=yFunction() showlabels=true pielabelsoutside=true showvalues=true labeltype=percent><svg></svg></nvd3-pie-chart></div><div class=container-fluid><a href="" ng-click="showTable = !showTable" class="btn btn-primary btn-lg">Toggle Full Table</a><table ts-wrapper="" ng-show=showTable class="table-responsive table table-hover"><thead><tr><th ts-criteria=id|lowercase>Name</th><th ts-criteria=geometry.coordinates.length|parseInt ts-default=descending>Length</th><th ts-criteria=properties.outlierThreshold>Outlier Threshold</th></tr></thead><tbody ng-repeat="trajectory in rawTrajectories" ts-repeat=""><tr><td>{{trajectory.id}}</td><td>{{trajectory.geometry.coordinates.length}}</td><td>{{trajectory.properties.outlierThreshold.toFixed(2)}}m</td></tr></tbody></table></div></div><div ng-include=&quot;components/footer/footer.html&quot;></div>'),a.put("app/main/main.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><header id=banner class=hero-unit><div class=container><h1>GeoVal v1.0</h1><p class=lead></p><img src=assets/images/53171c6d.geoVal.png alt="GeoVal"></div></header><div ng-include=&quot;components/footer/footer.html&quot;></div>'),a.put("app/map/map.html",'<div ng-include=&quot;components/navbar/navbar.html&quot;></div><div class=jumbotron><div class=row><div class=col-lg-10><openlayers id=map ol-center=center ol-defaults=defaults><ol-marker ng-repeat="marker in markers" ol-marker-properties=marker></ol-marker><ol-layer ol-layer-properties=layer ng-repeat="layer in layers"></ol-layer></openlayers></div><div class=col-lg-2><div class=well><label for=thresholdSlider>Current threshold lvl: {{sliderOptions.thresholdValue}} m ({{sliderOptions.renderedTrajectories}}/{{sliderOptions.loadedTrajectories}} trajectories rendered)</label><slider id=thresholdSlider ng-model=sliderOptions.thresholdValue min=sliderOptions.min step=sliderOptions.step max=sliderOptions.max value=sliderOptions.thresholdValue on-stop-slide=onStopSlide()></slider><label for=lengthSlider>Current length: {{sliderOptions.trajectoryLengthConstraint}} coordinates</label><slider id=lengthSlider ng-model=sliderOptions.trajectoryLengthConstraint min=sliderOptions.min step=sliderOptions.step max=sliderOptions.max/2 value=sliderOptions.trajectoryLengthConstraint on-stop-slide=onStopSlide()></slider><label for=markerToggle>Toggle markers</label><button id=markerToggle ng-click=toggleMarkers()><span>Toggle Markers</span></button><h3>Mouse click position<p ng-repeat="point in customTrajectory">{{point}}</p><button ng-click=clearTrajectory() class="btn btn-md btn-default"><span>Clear trajectory</span></button></h3></div></div></div></div>'),a.put("components/footer/footer.html",'<div ng-controller=FooterCtrl><footer class=footer><div class=container><p>geoVal {{geovalVersion}} | <a href="https://github.com/BenSower/geoval/issues?state=open">Report an issue</a></p></div></footer></div>'),a.put("components/modal/modal.html",'<div class=modal-header><button ng-if=modal.dismissable type=button ng-click=$dismiss() class=close>&times;</button><h4 ng-if=modal.title ng-bind=modal.title class=modal-title></h4></div><div class=modal-body><p ng-if=modal.text ng-bind=modal.text></p><div ng-if=modal.html ng-bind-html=modal.html></div></div><div class=modal-footer><button ng-repeat="button in modal.buttons" ng-class=button.classes ng-click=button.click($event) ng-bind=button.text class=btn></button></div>'),a.put("components/navbar/navbar.html",'<div ng-controller=NavbarCtrl class="navbar navbar-default navbar-static-top"><div class=container><div class=navbar-header><button type=button ng-click="isCollapsed = !isCollapsed" class=navbar-toggle><span class=sr-only>Toggle navigation</span><span class=icon-bar></span><span class=icon-bar></span><span class=icon-bar></span></button><a href="/" class=navbar-brand>geoval</a></div><div id=navbar-main collapse=isCollapsed class="navbar-collapse collapse"><ul class="nav navbar-nav"><li ng-repeat="item in menu" ng-class="{active: isActive(item.link)}"><a ng-href={{item.link}}>{{item.title}}</a></li><li ng-show=isLoggedIn() ng-class="{active: isActive(&quot;/map&quot;)}"><a href=/map>Map</a></li><li ng-show=isLoggedIn() ng-class="{active: isActive(&quot;/analysis&quot;)}"><a href=/analysis>Analysis</a></li><li ng-show=isAdmin() ng-class="{active: isActive(&quot;/admin&quot;)}"><a href=/admin>Admin</a></li></ul><ul class="nav navbar-nav navbar-right"><li ng-hide=isLoggedIn() ng-class="{active: isActive(&quot;/signup&quot;)}"><a href=/signup>Sign up</a></li><li ng-hide=isLoggedIn() ng-class="{active: isActive(&quot;/login&quot;)}"><a href=/login>Login</a></li><li ng-show=isLoggedIn()><p class=navbar-text>Hello {{ getCurrentUser().name }}</p></li><li ng-show=isLoggedIn() ng-class="{active: isActive(&quot;/settings&quot;)}"><a href=/settings><span class="glyphicon glyphicon-cog"></span></a></li><li ng-show=isLoggedIn() ng-class="{active: isActive(&quot;/logout&quot;)}"><a href="" ng-click=logout()>Logout</a></li></ul></div></div></div>')}]);