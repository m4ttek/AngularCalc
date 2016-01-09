/**
 * @author Mateusz Kamiński
 */
angular
    .module('CalcApp', ['ngRoute'])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

        $locationProvider.html5Mode(true);
  
        $routeProvider.when('/', {
            templateUrl: '/Templates/Calc.html',
            controller: 'calcController'
        }).when('/Home/About', {
            templateUrl: '/Templates/About.html',
            controller: 'aboutController'
        }).otherwise('/');

    }])
    .constant('calculatorButtonsConstant', {
        matrix: [
            [{ text: "7" }, { text: "8" }, { text: "9" }, { text: "/" }, { text: "sqrt" }],
            [{ text: "4" }, { text: "5" }, { text: "6" }, { text: "*" }, { text: "%" }],
            [{ text: "1" }, { text: "2" }, { text: "3" }, { text: "-" }, { text: "=", rowspan: 2, id: "equals_button" }],
            [{ text: "0" }, { text: "." }, { text: "+/-" }, { text: "+" }]
        ]
    })
    .controller('calcController',
       ['$scope', 'calcService', 'calculatorButtonsConstant', function ($scope, calcService, calculatorButtonsConstant) {

           // matryca kalkulatora
           $scope.calculatorMatrix = calculatorButtonsConstant.matrix;

           // rezultat obliczeń
           $scope.result = calcService.getResult();

           // czy kalkulator jest zablokowany
           $scope.isDisabled = calcService.isDisabled();

           // obsługa wciśniętego przycisku
           $scope.buttonClick = function (buttonText) {
               calcService.applyOperation(buttonText);
               $scope.isDisabled = calcService.isDisabled();
               if ($scope.isDisabled) {
                   $scope.result = "ERR";
               } else {
                   $scope.result = calcService.getResult();
               }
           };

       }])
    .controller('aboutController',
        [function () {

        }]);
