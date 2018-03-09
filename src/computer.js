'use strict';

import Utils from 'utils';
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

    getCoordinates () {
        let coords;
        if (this.needShootMatrix.length) {
            coords = this.needShoot();
        } else {
            coords = this.getCoordinatesShot();
        }

        return coords;
    }

    needShoot () {
        let val = this.needShootMatrix.shift();
        let coords = {
            x: val[0],
            y: val[1]
        }

        // удаляем координаты по которым произошел выстрел
        this.deleteElementMatrix(this.shootMatrix, coords);
        if (this.orderedShootMatrix.length != 0) {
            this.deleteElementMatrix(this.orderedShootMatrix, coords);
        }

        return coords;
    }

    getCoordinatesShot () {
        let rnd, val, coords;

        if (this.orderedShootMatrix.length != 0) {
            if (this.orderedShootMatrix.length > 10) {
                rnd = Utils.getRandom(9);
            } else {
                rnd = Utils.getRandom(this.orderedShootMatrix.length - 1);
            }
            val = this.orderedShootMatrix.splice(rnd, 1)[0];
        } else {
            rnd = Utils.getRandom(this.shootMatrix.length - 1),
            val = this.shootMatrix.splice(rnd, 1)[0];
        }

        coords = {
            x: val[0],
            y: val[1]
        };

        this.deleteElementMatrix(this.shootMatrix, coords);
        return coords;
    }

    getNeedCoordinatesShot (coords, enemy) {
        var kx = 0, ky = 0;

        if (Object.keys(this.firstHit).length === 0) {
            this.firstHit = coords;
        } else {
            this.lastHit = coords;
            kx = (Math.abs(this.firstHit.x - this.lastHit.x) == 1) ? 1 : 0;
            ky = (Math.abs(this.firstHit.y - this.lastHit.y) == 1) ? 1 : 0;
            this.firstHit = this.lastHit;
            this.lastHit = {};
        }

        if (coords.x > 0 && ky == 0) this.needShootMatrix.push([coords.x - 1, coords.y]);
        if (coords.x < 9 && ky == 0) this.needShootMatrix.push([coords.x + 1, coords.y]);
        if (coords.y > 0 && kx == 0) this.needShootMatrix.push([coords.x, coords.y - 1]);
        if (coords.y < 9 && kx == 0) this.needShootMatrix.push([coords.x, coords.y + 1]);

        for (let i = this.needShootMatrix.length - 1; i >= 0; i--) {
            let x = this.needShootMatrix[i][0];
            let y = this.needShootMatrix[i][1];
            //удаляем точки, по которым уже проводился обстрел или стрельба не имеет смысла
            if (enemy.matrix[x][y] != 0 && enemy.matrix[x][y] != 1) {
                this.needShootMatrix.splice(i,1);
                this.deleteElementMatrix(this.shootMatrix, coords);
                if (this.orderedShootMatrix.length != 0) {
                    this.deleteElementMatrix(this.orderedShootMatrix, coords);
                }
            }
        }
    }

    markUnnecessaryCell (coords, enemy) {
        let icons = enemy.element.querySelectorAll('.icon-field');
        let points = [
            [coords.x - 1, coords.y - 1],
            [coords.x - 1, coords.y + 1],
            [coords.x + 1, coords.y - 1],
            [coords.x + 1, coords.y + 1]
        ];

        for (let i = 0; i < 4; i++) {
            let flag = true;
            if (points[i][0] < 0 || points[i][0] > 9 || points[i][1] < 0 || points[i][1] > 9) continue; // за пределами игрового поля

            for (let j = 0; j < icons.length; j++) {
                var x = icons[j].style.top.slice(0, -2) / enemy.shipSize,
                    y = icons[j].style.left.slice(0, -2) / enemy.shipSize;
                if (points[i][0] == x && points[i][1] == y) {
                    flag = false;
                    break;
                }
            }
            if (flag === false) continue;

            let obj = {
                x: points[i][0],
                y: points[i][1]
            }
            enemy.matrix[obj.x][obj.y] = 2;

            // удаляем из массивов выстрелов ненужные координаты
            this.deleteElementMatrix(this.shootMatrix, obj);
            if (this.needShootMatrix.length != 0) {
                this.deleteElementMatrix(this.needShootMatrix, obj);
            }

            if (this.orderedShootMatrix.length != 0) {
                this.deleteElementMatrix(this.orderedShootMatrix, obj);
            }
        }
    }

    deleteElementMatrix (array, obj) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i][0] == obj.x && array[i][1] == obj.y) {
                array.splice(i, 1);
            }
        }
    }
};