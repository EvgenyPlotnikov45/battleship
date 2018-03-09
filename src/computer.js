'use strict';

import Field from 'field';

export default class Computer extends Field {
    constructor (element) {
        super(...arguments);
        // массив с координатами выстрелов при рандомном выборе
        this.shootMatrix = [];
        // массив с координатами выстрелов для AI
        this.orderedShootMatrix = [];
        // массив с координатами вокруг клетки с попаданием
        this.needShootMatrix = [];
        // объекты для хранения первого и след. выстрела
        this.firstHit = {};
        this.lastHit = {};
        // массив значений циклов при формировании координат стрельбы
        var loopValues = [
            [1, 0, 10],
            [2, 0, 10],
            [3, 0, 10]
        ];
        this.createShootMatrix(loopValues[0]);
        for (var i = 1; i < loopValues.length; i++) {
            this.createShootMatrix(loopValues[i]);
        }
    }

    createShootMatrix (values) {
        var type = values[0],
            min = values[1],
            max = values[2];

        switch(type) {
            case 1:
                for (var i = min; i < max; i++) {
                    for(var j = min; j < max; j++) {
                        this.shootMatrix.push([i, j]);
                    }
                }
                break;
            case 2:
                for (var i = min; i < max; i++) {
                    this.orderedShootMatrix.push([i, i]);
                }
                break;
            case 3:
                for (var i = min; i < max; i++) {
                    this.orderedShootMatrix.push([max - i - 1, i]);
                }
                break;
        };
    }
};