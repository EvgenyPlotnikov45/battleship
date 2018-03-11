'use strict';

import Utils from 'utils';
import Ship from 'ship';

export default class Field {
    constructor (fieldElement) {
        this.index = 0;
        this.active = true;
        this.size = 300;
        this.shipSize = 30;
        this.shipsData  = [
            {type: 'fourdeck', amount: 1, size: 4},
            {type: 'tripledeck', amount: 2, size: 3},
            {type: 'doubledeck', amount: 3, size: 2},
            {type: 'singledeck', amount: 4, size: 1}
        ];

        this.wrapper = fieldElement;
        this.element = fieldElement.firstChild;
        this.squadron = [];
        this.matrix = Utils.createMatrix();
        this.hiddenShips = [];
    }

    get elementX () {
        return this.element.getBoundingClientRect().top + pageYOffset;
    }

    get elementY () {
        return this.element.getBoundingClientRect().left + pageXOffset;
    }

    get elementRight () {
        return this.elementY + this.size;
    }

    get elementBtm () {
        return this.elementX + this.size;
    }

    get fullName () {
        return this.name + this.index;
    }

    show () {
        this.wrapper.setAttribute('data-hidden', false);
    }

    hide () {
        this.wrapper.setAttribute('data-hidden', true);
    }

    /**
     * Случайное распределение кораблей на поле.
     */
    randomLocationShips () {
        this.matrix = Utils.createMatrix();
        var data = this.shipsData;
        for (var i = 0; i < data.length; i++) {
            var decks = data[i].size; // кол-во палуб
            var amount = data[i].amount; // кол-во кораблей
            for (var j = 0; j < amount; j++) {
                // получаем координаты первой палубы и направление расположения палуб (корабля)
                var fc = this.getCoordinatesDecks(decks);
                fc.decks = decks;
                fc.shipname = data[i].type + String(j + 1);
                // создаём экземпляр корабля и выводим на экран
                var ship = new Ship(this, fc);
                ship.createShip();
            }
        }
    }

    /**
     * @param  {Number}
     * @return {Object}
     */
    getCoordinatesDecks (decks) {
        // kx == 1 - вертикально, ky == 1 - горизонтально
        let kx = Utils.getRandom(1),
            ky = (kx == 0) ? 1 : 0,
            x, y;

        if (kx == 0) {
            x = Utils.getRandom(9);
            y = Utils.getRandom(10 - decks);
        } else {
            x = Utils.getRandom(10 - decks);
            y = Utils.getRandom(9);
        }

        // валидация палуб корабля
        let result = this.checkLocationShip(x, y, kx, ky, decks);
        if (!result) return this.getCoordinatesDecks(decks);

        return {x, y, kx, ky};
    }

    /**
     * Проверка возможности нахождения корабля в переданных координатах.
     * @param  {Number} x
     * @param  {Number} y
     * @param  {Number} kx
     * @param  {Number} ky
     * @param  {Number} decks
     * @return {Boolean}
     */
    checkLocationShip (x, y, kx, ky, decks) {
        let fromX, toX, fromY, toY;

        fromX = (x == 0) ? x : x - 1;
        if (x + kx * decks == 10 && kx == 1) toX = x + kx * decks;
        else if (x + kx * decks < 10 && kx == 1) toX = x + kx * decks + 1;
        else if (x == 9 && kx == 0) toX = x + 1;
        else if (x < 9 && kx == 0) toX = x + 2;

        fromY = (y == 0) ? y : y - 1;
        if (y + ky * decks == 10 && ky == 1) toY = y + ky * decks;
        else if (y + ky * decks < 10 && ky == 1) toY = y + ky * decks + 1;
        else if (y == 9 && ky == 0) toY = y + 1;
        else if (y < 9 && ky == 0) toY = y + 2;

        // если корабль при повороте выходит за границы игрового поля
        // т.к. поворот происходит относительно первой палубы, то 
        // fromX и from, всегда валидны
        if (toX === undefined || toY === undefined) return false;

        for (let i = fromX; i < toX; i++) {
            for (let j = fromY; j < toY; j++) {
                if (this.matrix[i][j] == 1) return false;
            }
        }
        return true;
    }

    /**
     * Создаем пустую матрицу
     */
    resetMatrix () {
        this.matrix = Utils.createMatrix();
    }

    /**
     * Очищаем все корабли с поля и удаляем их.
     */
    cleanField () {
        let element = this.element;
        let divs = element.querySelectorAll('div.ship');

        for (let el of divs) {
            parent.removeChild(el);
        }
        // очищаем массив объектов кораблей
        this.squadron.length = 0;
    }

    /**
     * Скрываем все корабли на поле, но при этом не удаляем их, а сохраняем
     * в отдельный массив для возможного дальнейшего отображения.
     */
    hideShips () {
        let element = this.element;
        let ships = element.querySelectorAll('div.ship');
        for (let ship of ships) {
            this.hiddenShips.push(element.removeChild(ship));
        }
    }

    /**
     * Отображаем скрытые корабли на поле
     */
    showShips () {
        var element = this.element;
        var hiddenShips = this.hiddenShips;
        for (let ship of hiddenShips) {
            element.appendChild(ship);
        }
        hiddenShips = [];
    }

    /**
     * Метод возвращает корабль, который находится по переданным координатам
     * @param  {Object}
     * @return {Ship}
     */
    getShipByCoord (coords) {
        for (let ship of this.squadron) {
            for (let matrix of ship.matrix) {
                if (matrix[0] == coords.x && matrix[1] == coords.y) {
                    return ship;
                }
            }
        }
    }

    /**
     * Удаление корабля
     * @param  {Ship}
     */
    deleteShip (ship) {
        for (let i = 0; i < this.squadron.length; i++) {
            if (this.squadron[i] === ship) {
                this.squadron.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Проверка, остались ли еще живые корабли на поле
     * @return {Boolean}
     */
    hasShips () {
        return !!this.squadron.length;
    }
};