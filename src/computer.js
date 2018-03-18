'use strict';

import Utils from 'utils';
import Field from 'field';

export default class Computer extends Field {
    constructor (element) {
        super(...arguments);
        this.enemy = null;
        this.name = 'Компьютер';
        // массив с координатами выстрелов при рандомном выборе
        this.shootMatrix = [];
        // массив с координатами вокруг клетки с попаданием
        this.needShootMatrix = [];
        // объекты для хранения первого и след. выстрела
        this.firstHit = {};
        this.lastHit = {};
    }

    /**
     * Актуализируем информацию по переданным координатам, очищая матрицы.
     * @param  {Object}
     */
    actualizeMatrixData (coords) {
        this.deleteElementMatrix(this.shootMatrix, coords);
        this.deleteElementMatrix(this.needShootMatrix, coords);
    }

    /**
     * Компьютер должен выбрать себе цель для обстрела, поэтому
     * он рандомно выбирает цель из массива игроков актуальных игроков
     * и сохраняет её у себя. Компьютер будет стрелять по выбранной цели, пока
     * она активна, а дальше выберет себе новую цель.
     * @param  {Array} players
     * @return {Field}
     */
    getEnemy (players) {
        if (!this.enemy || (this.enemy && !this.enemy.active)) {
            let filteredPlayers = players.filter((player) => {
                return player.active && player !== this;
            });

            let randomIndex = Utils.getRandom(filteredPlayers.length - 1);
            this.enemy = filteredPlayers[randomIndex];
            this.createShootMatrix();
        }

        return this.enemy;
    }

    /**
     * Очищаем и заполняем матрицы обстрела противника.
     */
    createShootMatrix () {
        let min = 0;
        let max = 10;
        this.shootMatrix = [];
        this.needShootMatrix = [];
        for (let i = min; i < max; i++) {
            for(let j = min; j < max; j++) {
                this.shootMatrix.push([i, j]);
            }
        }
    }

    /**
     * Метод возвращает более приоритетные координаты для обстрела
     * @return {Object}
     */
    getCoordinates () {
        let coords;
        if (this.needShootMatrix.length) {
            coords = this.needShoot();
        } else {
            coords = this.getCoordinatesShot();
        }

        return coords;
    }

    /**
     * Возвращаем координаты из матрицы обстрела вокруг подбитой клетки.
     * @return {Object}
     */
    needShoot () {
        let val = this.needShootMatrix.shift();
        let coords = {
            x: val[0],
            y: val[1]
        }

        // удаляем координаты по которым произошел выстрел
        this.deleteElementMatrix(this.shootMatrix, coords);

        return coords;
    }

    /**
     * Метод определяет и возвращает координаты для обстрела.
     * @return {Object}
     */
    getCoordinatesShot () {
        let rnd = Utils.getRandom(this.shootMatrix.length - 1);
        let val = this.shootMatrix.splice(rnd, 1)[0];
        let coords = {
            x: val[0],
            y: val[1]
        };

        this.deleteElementMatrix(this.shootMatrix, coords);
        return coords;
    }

    /**
     * Проверка и установка координат, которые нужно будет обстрелять, так как там
     * потенциально может быть корабль
     * @param {Object} coords
     * @param {Field}
     */
    checkNeedCoordinates (coords) {
        let kx = 0, ky = 0;
        if (Object.keys(this.firstHit).length === 0) {
            this.firstHit = coords;
        } else {
            this.lastHit = coords;
            kx = (Math.abs(this.firstHit.x - this.lastHit.x) == 1) ? 1 : 0;
            ky = (Math.abs(this.firstHit.y - this.lastHit.y) == 1) ? 1 : 0;
            this.firstHit = this.lastHit;
            this.lastHit = {};
        }

        if (coords.x > 0 && ky == 0) this.setNeedCoord(coords.x - 1, coords.y);
        if (coords.x < 9 && ky == 0) this.setNeedCoord(coords.x + 1, coords.y);
        if (coords.y > 0 && kx == 0) this.setNeedCoord(coords.x, coords.y - 1);
        if (coords.y < 9 && kx == 0) this.setNeedCoord(coords.x, coords.y + 1);
    }

    /**
     * @param {Number} x
     * @param {Number} y
     */
    setNeedCoord (x, y) {
        let enemyMatrixValue = this.enemy.matrix[x][y];
        if (enemyMatrixValue === 0 || enemyMatrixValue === 1) {
            this.needShootMatrix.push([x, y]);
        }
    }

    /**
     * Метод проверяет точки, находящиеся подиагонали от переданных координат.
     * Данные точки помечаются как обстреляные и удаляются из матриц обстрела.
     * @param  {Object}
     * @return {[type]}
     */
    checkUnnecessaryCell (coords) {
        let points = [
            {x: coords.x - 1, y: coords.y - 1},
            {x: coords.x - 1, y: coords.y + 1},
            {x: coords.x + 1, y: coords.y - 1},
            {x: coords.x + 1, y: coords.y + 1}
        ];

        for (let point of points) {
            // если точка за пределами игрового поля, пропускаем
            if (point.x < 0 || point.x > 9 || point.y < 0 || point.y > 9) continue;
            // если точка уже помечена, пропускаем
            if (this.enemy.matrix[point.x][point.y] !== 0) continue;

            let cellCoord = {x: point.x, y: point.y};
            this.enemy.matrix[cellCoord.x][cellCoord.y] = 2;
            Utils.showIcons(this.enemy, cellCoord, 'dot');
            // удаляем из массивов выстрелов ненужные координаты
            this.deleteElementMatrix(this.shootMatrix, cellCoord);
            this.deleteElementMatrix(this.needShootMatrix, cellCoord);
        }
    }

    /**
     * Метод удаляет из массива переданные координаты
     * @param  {Array}
     * @param  {Object}
     */
    deleteElementMatrix (array, coord) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i][0] == coord.x && array[i][1] == coord.y) {
                array.splice(i, 1);
                break;
            }
        }
    }
};