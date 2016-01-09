angular.module('CalcApp')
    .factory('calculatorBean', ['$filter', function ($filter) {
        // maksymalna liczba cyfr, jakie może obsługiwać kalkulator
        var MAX_SIGNS = 16;
        // bufor na wprowadzane znaki do kalkulatora (0-9, .)
        var buffer = [];
        // przechowuje pierwszą liczbę dla operacji
        var firstNumber = null;
        // przechowuje drugą liczbę dla operacji
        var secondNumber = null;
        // czy kalkulator jest zablokowany
        var isBlocked = false;
        // wyświetlacz kalkulatora
        var display = "0";
        // operacja do wykonania
        var operation = null;

        return {
            addToBuffer: function (element) {
                if (angular.isString(element) && buffer.length < MAX_SIGNS) {
                    buffer.push(element);
                }
                return this;
            },
            prependToBuffer : function (element) {
                if (angular.isString(element)) {
                    buffer.unshift(element);
                }
            },
            removeElementFromBuffer : function (elementNumber) {
                if (angular.isNumber(elementNumber)) {
                    buffer.splice(elementNumber, 1);
                }
            },
            getBufferElement : function (elementNumber) {
                if (angular.isNumber(elementNumber)) {
                    return buffer[elementNumber];
                }
            },
            getNumberOfElements : function () {
                return buffer.length;
            },
            isBufferEmpty: function () {
                return buffer.length === 0;
            },
            clearBuffer: function () {
                buffer = [];
            },
            bufferContains: function (element) {
                return buffer.indexOf(element) !== -1;
            },
            joinBuffer: function () {
                return buffer.join("");
            },
            getNumberFromBuffer : function() {
                return parseFloat(buffer.join(""));
            },
            getDisplay: function () {
                return display;
            },
            setDisplay: function (disp) {
                if (angular.isString(disp)) {
                    display = disp;
                } else if (angular.isNumber(disp)) {
                    if (disp === 0) {
                        display = '0';
                        return;
                    }
                    var formattedNumber = disp.toPrecision(15);
                    if (formattedNumber.indexOf('e') !== -1) {
                        display = formattedNumber;
                        return;
                    }
                    display = /(\-?\d*[\.\d]*[1-9]+)\.?0+/g.exec(formattedNumber);
                    if (angular.isArray(display) && display.length > 0) {
                        display = display[1];
                    } else {
                        display = formattedNumber;
                    }
                }
            },
            getFirstNumber: function () {
                return firstNumber;
            },
            setFirstNumber: function (number) {
                if (angular.isNumber(number)) {
                    firstNumber = number;
                }
            },
            setSecondNumber: function (number) {
                if (angular.isNumber(number)) {
                    secondNumber = number;
                }
            },
            clearFirstNumber: function() {
                firstNumber = null;
            },
            clearSecondNumber: function() {
                secondNumber = null;
            },
            getSecondNumber: function () {
                return secondNumber;
            },
            getOperation : function () {
                return operation;
            },
            setOperation : function (op) {
                if (angular.isFunction(op)) {
                    operation = op;
                }
            },
            clearOperation : function () {
                operation = null;
            },
            block: function () {
                isBlocked = true;
            },
            unblock: function () {
                isBlocked = false;
            },
            getIsBlocked: function () {
                return isBlocked;
            },
            // wykonuje operację, o ile wszystkie wymagane zmienne są ustawione
            makeCalculationIfPossible: function () {
                if (angular.isNumber(firstNumber) && angular.isNumber(secondNumber) && angular.isFunction(operation)) {
                    var operationResult = operation(firstNumber, secondNumber);
                    if (!isFinite(operationResult)) {
                        isBlocked = true;
                    }
                    return operationResult;
                }
            },
            // czyści stan kalkulatora
            clearState: function () {
                buffer = [];
                firstNumber = null;
                secondNumber = null;
                isBlocked = false;
                display = "0";
            }
        };
    }])
    .factory('calcService',
        ['$injector', 'calculatorBean', function ($injector, calculatorBean) {

            // tablica serwisów udostępniających operacje możliwe do wykonania na kalkulatorze
            var calcOperations = [];

            angular.module('CalcApp')['_invokeQueue'].forEach(function (value) {

                // jeżeli obiekt jest serwisem oraz zawiera w nazwie 'CalcOperationService' to potencjalnie jest
                // to serwis wykonujący operację na kalkulatorze
                if (value[1] === 'factory' && value[2][0].indexOf('CalcOperationService') !== -1) {
                    var calcOperationService = $injector.get(value[2][0]);
                    if (calcOperationService !== undefined && angular.isFunction(calcOperationService.calculate)) {
                        calcOperations.push(calcOperationService);
                    }
                }
            });

            return {
                // zwraca rezultat wykonanych operacji na kalkulatorze
                getResult: function () {
                    return calculatorBean.getDisplay();
                },
                // zwraca informację, czy kalkulator jest zablokowany
                isDisabled: function () {
                    return calculatorBean.getIsBlocked();
                },
                // przekazuje operację do wykonania serwisom
                applyOperation: function (op) {
                    calcOperations.forEach(function (calcOperation) {
                        calcOperation.calculate(op);
                    });
                }
            };
        }])
    .factory('ClearCalcOperationService', ['calculatorBean', function (calculatorBean) {
        return {
            calculate: function (operation) {
                if (operation === "C") {
                    calculatorBean.clearState();
                }
            }
        };
    }])
    .factory('DefaultCalcOperationService', ['calculatorBean', function (calculatorBean) {
        // obsługiwane znaki
        var SIGNS = "01234567890.";

        return {
            calculate: function (operation) {
                if (SIGNS.indexOf(operation) === -1 || calculatorBean.getIsBlocked())
                    return;
                
                if ("." === operation) {
                    if (calculatorBean.isBufferEmpty()) {
                        calculatorBean.addToBuffer("0");
                    }
                    if (!calculatorBean.bufferContains('.')) {
                        calculatorBean.addToBuffer('.');
                    }
                } else if (calculatorBean.getBufferElement(0) === '0' && calculatorBean.getNumberOfElements() === 1) {
                    calculatorBean.clearBuffer();
                    calculatorBean.addToBuffer(operation);
                } else {
                    calculatorBean.addToBuffer(operation);
                }
                // rozpoczęcie wpisywania nowej liczby do kalkulatora powoduje wyzerowanie operacji, jeśli liczby już istnieją
                if (angular.isNumber(calculatorBean.getFirstNumber()) && angular.isNumber(calculatorBean.getSecondNumber())) {
                    calculatorBean.clearOperation();
                }
                calculatorBean.setDisplay(calculatorBean.joinBuffer());
            }
        };
    }])
    .factory('ChangeSignCalcOperationService', ['calculatorBean', function (calculatorBean) {
        return {
            calculate: function (operation) {
                if ("+/-" !== operation || calculatorBean.getIsBlocked())
                    return null;
                
                // jeżeli bufor jest dostępny to zmieniamy w nim pierwszy znak
                if (!calculatorBean.isBufferEmpty()) {
                    if (calculatorBean.getBufferElement(0) === '-') {
                        calculatorBean.removeElementFromBuffer(0);
                    } else {
                        calculatorBean.prependToBuffer('-');
                    }
                    calculatorBean.setDisplay(calculatorBean.joinBuffer());
                } else if (angular.isNumber(calculatorBean.getFirstNumber())) {
                    // jeżeli w pamięci istnieje już jakaś liczba to zmieniamy jej znak
                    calculatorBean.setFirstNumber(- calculatorBean.getFirstNumber());
                    calculatorBean.setDisplay(calculatorBean.getFirstNumber());
                }
            }
        }
    }])
    .factory('SimpleMathCalcOperationService', ['calculatorBean', function (calculatorBean) {
        
        var MATH_OPERATIONS = {
            "+" : function (t, u) { return t + u },
            "-" : function (t, u) { return t - u },
            "/" : function (t, u) { return t / u },
            "*" : function (t, u) { return t * u }
        };
        
        return {
            calculate: function (operation) {
                if (!angular.isDefined(MATH_OPERATIONS[operation]) || calculatorBean.getIsBlocked())
                    return;
                
                // jeśli istnieje już coś w buforze, to trzeba to uznać za wprowadzoną liczbę
                if (!calculatorBean.isBufferEmpty()) {
                    var newValue = calculatorBean.getNumberFromBuffer();
                    if (angular.isNumber(calculatorBean.getFirstNumber())) {
                        calculatorBean.setSecondNumber(newValue);
                    } else {
                        calculatorBean.setFirstNumber(newValue);
                    }
                    calculatorBean.clearBuffer();
                }

                calculatorBean.setOperation(MATH_OPERATIONS[operation]);

                var result = calculatorBean.makeCalculationIfPossible();
                if (angular.isNumber(result)) {
                    calculatorBean.setFirstNumber(result);
                    calculatorBean.setDisplay(result);
                    calculatorBean.clearSecondNumber();
                }
                
            }
        };
    }])
    .factory('SquareRootCalcOperationService', ['calculatorBean', function (calculatorBean) {
        return {
            calculate: function (operation) {
                if ("sqrt" !== operation || calculatorBean.getIsBlocked())
                    return;

                var value;
                if (calculatorBean.isBufferEmpty()) {
                   value = calculatorBean.getFirstNumber();
                } else {
                    value = calculatorBean.getNumberFromBuffer();
                    calculatorBean.clearBuffer();
                }
                value = Math.sqrt(value);
                if (!isFinite(value)) {
                    calculatorBean.block();
                }
                calculatorBean.setFirstNumber(value);
                calculatorBean.setDisplay(value);
            }
        };
    }])
    .factory('PercentageCalcOperationService', ['calculatorBean', function (calculatorBean) {
        return {
            calculate: function (operation) {
                if ("%" !== operation || calculatorBean.getIsBlocked())
                    return;
                
                var value;
                if (calculatorBean.isBufferEmpty()) {
                    value = calculatorBean.getFirstNumber();
                } else if (angular.isNumber(calculatorBean.getFirstNumber())) {
                    value = calculatorBean.getNumberFromBuffer();
                    calculatorBean.clearBuffer();
                }
                if (angular.isNumber(value)) {
                    value = value * 0.01;
                    if (!isFinite(value)) {
                        calculatorBean.block();
                    }
                    if (angular.isFunction(calculatorBean.getOperation())) {
                        calculatorBean.setSecondNumber(value);
                    } else {
                        calculatorBean.setFirstNumber(value);
                    }
                    calculatorBean.setDisplay(value);
                }
			}
        };
    }])
    .factory('EnterCalcOperationService', ['calculatorBean', function (calculatorBean) {
        return {
            calculate: function (operation) {
                if ("=" !== operation || calculatorBean.getIsBlocked())
                    return;

                // jeśli operacja i bufor jest dostępny to wartość przepisywana jest do drugiej liczby
                if (angular.isFunction(calculatorBean.getOperation()) && !calculatorBean.isBufferEmpty()) {
                    calculatorBean.setSecondNumber(calculatorBean.getNumberFromBuffer());
                }

                // operacja zawsze czyści bufor
                calculatorBean.clearBuffer();

                // jeżeli dostępna jest operacja do wykonania, ale drugiej liczby nie ma, powtarzana jest pierwsza z liczb
                if (angular.isFunction(calculatorBean.getOperation()) && !angular.isNumber(calculatorBean.getSecondNumber())) {
                    calculatorBean.setSecondNumber(calculatorBean.getFirstNumber());
                }

                var result = calculatorBean.makeCalculationIfPossible();
                if (angular.isNumber(result)) {
                    calculatorBean.setFirstNumber(result);
                    calculatorBean.setDisplay(result);
                }
            }
        };
    }]);
