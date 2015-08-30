// объявляем модуль
var piechartModule = angular.module('piechart', ['ngRoute', 'ngCookies', 'ngMockE2E']);

piechartModule.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    // настройка роутинга
    $routeProvider
        .when('/login', {
            controller: 'LoginController',
            templateUrl: '/login.html'
        })

        .when('/register', {
            controller: 'RegistrationController',
            templateUrl: '/register.html'
        })

        .when('/PieChart', {
            controller: 'PiechartController',
            templateUrl: '/PieChart.html'
        })

        .otherwise({ redirectTo: '/PieChart' });

    $locationProvider.html5Mode(true); // для того чтобы убрать # из URL'ов
}])

.run(['$rootScope', '$location', '$cookieStore', '$http', function ($rootScope, $location, $cookieStore, $http) {
    // читаем из куки
    $rootScope.globals = $cookieStore.get('globals') || {};
    if ($rootScope.globals.currentUser) { // если в куки имеются данные авторизации, устанвливаем их в заголовки запросов
        $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; 
    }

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // перенаправляем на страницу авторизации, если пользователь попытается проникнуть на главную страницу не авторизовавшись
        if ($location.path() !== '/login' && $location.path() !== '/register' && !$rootScope.globals.currentUser) {
            $location.path('/login');
        }
    });
}]);