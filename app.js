var app = angular.module('RedditEmblemViewer', ['ngRoute']);
app.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when("/", {templateUrl: "auth.html", controller: "AuthCtrl"})
		.when("/map", {templateUrl: "home.html", controller: "HomeCtrl"});
}]);