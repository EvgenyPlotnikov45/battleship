'use strict';

export default class Utils {
    static createMatrix () {
        var x = 10, y = 10, arr = [10];
        for (var i = 0; i < x; i++) {
            arr[i] = [10];
            for(var j = 0; j < y; j++) {
                arr[i][j] = 0;
            }
        }
        return arr;
    }

    static getRandom (n) {
        // n - максимальное значение, которое хотим получить
        return Math.floor(Math.random() * (n + 1));
    }

    static getCoords (el) {
        var coords = el.getBoundingClientRect();
        return {
            top: coords.top + pageYOffset,
            left: coords.left + pageXOffset
        };
    }
};