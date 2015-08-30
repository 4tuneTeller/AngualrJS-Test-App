var angualrModule = angular.module('piechart');

// контроллер страницы авторизации
angualrModule.controller('LoginController',
    ['$scope', '$rootScope', '$location', 'AuthenticationService',
    function ($scope, $rootScope, $location, AuthenticationService) {
        // при входе на страницу login сбрасываем состояние авторизации
        AuthenticationService.ClearCredentials();

        // по нажатию кнопки login произойдет вызов сервиса авторизации
        $scope.login = function () {
            $scope.dataLoading = true;
            AuthenticationService.Login($scope.username, $scope.password, function (response) {
                if (response.success) { // если авторизация прошла успешно - сохраняем авторизацию и перенаправляем на страницу с графиком
                    AuthenticationService.SetCredentials($scope.username, $scope.password);
                    $location.path('/PieChart');
                } else {
                    $scope.error = response.message;
                    $scope.dataLoading = false;
                }
            });
        };
    }]);

// контроллер страницы регистрации
angualrModule.controller('RegistrationController',
    ['$scope', '$http', '$location', 'AuthenticationService',
    function ($scope, $http, $location, AuthenticationService) {
        // сбрасываем состояние авторизации
        AuthenticationService.ClearCredentials();

        // запрос регистрации по нажатию кнопки
        $scope.register = function () {
            $scope.dataLoading = true;
            $http.post('/authservice/register', { name: $scope.username, password: $scope.password })
                .then(function (response) { //successful respond
                    AuthenticationService.Login($scope.username, $scope.password, function (response) { // если пользователь успешно зарегестрирован - логинимся и перенаправляем на страницу с графиком
                        if (response.success) {
                            AuthenticationService.SetCredentials($scope.username, $scope.password);
                            $location.path('/PieChart');
                        } else {
                            $scope.error = response.message;
                            $scope.dataLoading = false;
                        }
                    });
                }, function (response) { //failed respond
                    $scope.error = "User with that name already exist";
                    $scope.dataLoading = false;
                });
        };
    }]);

// контролллер страницы с графиком
angualrModule.controller('PiechartController',
    ['$scope', '$timeout', '$http', '$httpBackend',
    function ($scope, $timeout, $http) {
        // для случайной генерации цвета: побитовое смещение влево на 24 знака эквивалнетно возведению 2 в 24 степень и в 16-ричной системе равно FFFFFF + 1 (+1 не страшен, потому что Math.random() возвращает число в промежутке [0, 1) а так как делее у нас будет округление вниз, то максимальным числом цвета как раз и будет FFFFFF)
        var maxColorVal = (1 << 24);
        
        // обращение к сервису для получения данных для построения диаграммы
        $http.get('/foods').then(function (response) {
            // модифицируем полученный список
            $scope.chartData = response.data.foodChrt.map(function (item) {
                return {
                    title: item.title,
                    amount: item.amount,
                    color: '#' + addLeadingZeroes((Math.floor(Math.random() * maxColorVal)).toString(16)) // добавим случайно сгенерированный цвет
                }
            }).sort(function (a, b) { // отсортируем в порядке убывания amount
                return b.amount - a.amount;
            });

            // здесь я просто проверял, что диаграмма реагирует на изменения локальных данных
            $timeout(function () { $scope.chartData[0].amount = 10; }, 2500)
            $timeout(function () { $scope.chartData.pop(); }, 5000)

            // функция для добавления нулей перед случайно сгенерировнным 16-ричным числом
            function addLeadingZeroes(s) {
                var size = 6;
                while (s.length < size) s = "0" + s;
                return s;
            }
        }, function (response) {
            // здесь должен быть код для обработки ошибки обращения к серверу, в случае возникновения таковой...
        });
    }])
.directive('myPiechart', function () { // директива для отрисовки диаграммы в canvas
    var cx, cy, radius, ctx;
    var myCanvas;

    function draw(data, olddata) {
        // проверка, на случай, если диаграмма попытается отрисоваться до того, как данные будут получены с сервера
        if (data === undefined) return;

        // получаем контекст канваса
        ctx = myCanvas.getContext("2d");
        // очищаем канвас
        ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
        // находим центр канваса и радиус диаграммы (с отступом)
        cx = myCanvas.width / 2;
        cy = myCanvas.height / 2;
        radius = cx < cy ? cx - 10 : cy - 10;

        // находим сумму всех значений Amount
        var itemsSum = 0;
        for (var i = 0; i < data.length; i++) {
            itemsSum += data[i].amount;
        }

        var fullCircle = 2 * Math.PI; // угол полного круга
        var prevAngle = 0; // здесь будем хранить угол, до которого мы дорисовали сектор диаграммы на каждом шаге и с какого нужно начинать рисовать следующий сектор
        for (var i = 0; i < data.length; i++) {
            ctx.fillStyle = data[i].color;
            var endAngle = prevAngle + fullCircle * data[i].amount / itemsSum; // вычисляем конечный угол сектора
            drawPizzaSlice(prevAngle, endAngle); // рисуем сектор
            prevAngle = endAngle; // сохраняем угол
        }
    }

    function chartController($scope, $element) {
        myCanvas = $element[0];

        // следим за изменениями параметра chartData и в случае чего - перерисовываем диарамму
        $scope.$watch('chartData', draw, true);
    }

    // функция рисования секторов диаграммы
    function drawPizzaSlice(startAngle, endAngle) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.fill();
    }

    return {
        restrict: 'A',
        scope: {
            chartData: '=chart'
        },
        controller: chartController
    };
});