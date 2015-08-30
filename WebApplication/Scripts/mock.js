angular.module('piechart').run(['$httpBackend', function ($httpBackend) {
    var incommingJson = {
        "foodChrt": [
            { "title": "Apples", "amount": 30 },
            { "title": "Potatoes", "amount": 100 },
            { "title": "Bananas", "amount": 30 },
            { "title": "Carrots", "amount": 50 }
        ]
    };

    //var users = [{"name": "test", "password": "test"}];

    // возвращает фейковый список
    $httpBackend.whenGET('/foods').respond(incommingJson);

    // добавляет объект в спиок
    $httpBackend.whenPOST('/foods').respond(function (method, url, data) {
        var food = angular.fromJson(data);
        incommingJson.foodChrt.push(food);
        return [200, food, {}];
    });

    // имитация сервиса авторизации
    $httpBackend.whenPOST('/authservice/auth').respond(function (method, url, data) {
        var user = JSON.parse(data);
        var response;
        var users = getUsers();
        if (users.some(function (e) { return e.name == user.name && e.password == user.password })) {
            response = [200, user, {}];
        } else response = [401, 0, {}];
        return response;
    });

    // имитация регистрации
    $httpBackend.whenPOST('/authservice/register').respond(function (method, url, data) {
        var newUser = JSON.parse(data);
        var response;
        var users = getUsers();
        if (users.some(function (e) { return e.name == newUser.name })) { // проверяем, нет ли пользователя с таким же именем 
            response = [409, 0, {}];
        } else { // если нет - добавляем его и устанавливаем положительный response
            users.push(newUser);
            setUsers(users);
            response = [201, newUser, {}];
        }
        return response;
    });

    // функции сохраниения и получения пользователей из локального хранилища HTML5
    function getUsers() {
        if (!localStorage.users) {
            localStorage.users = JSON.stringify([]);
        }

        return JSON.parse(localStorage.users);
    }

    function setUsers(users) {
        localStorage.users = JSON.stringify(users);
    }

    // список URI, на которые наш mock не должен реагировать (к сожалению, не успел разобраться, почему не работает фильтрация по regex)
    //$httpBackend.whenGET(/^\/templates\//).passThrough();
    //$httpBackend.whenGET(/views\/.*/).passThrough();
    $httpBackend.whenGET('/PieChart.html').passThrough();
    $httpBackend.whenGET('/login.html').passThrough();
    $httpBackend.whenGET('/register.html').passThrough();
    //...
}])