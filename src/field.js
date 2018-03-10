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

    getCoordinatesDecks (decks) {
        // kx == 1 - вертикально, ky == 1 - горизонтально
        var kx = Utils.getRandom(1),
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
        var result = this.checkLocationShip(x, y, kx, ky, decks);
        if (!result) return this.getCoordinatesDecks(decks);

        var obj = {
            x: x,
            y: y,
            kx: kx,
            ky: ky
        };
        return obj;
    }

    checkLocationShip (x, y, kx, ky, decks) {
        var fromX, toX, fromY, toY;

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

        for (var i = fromX; i < toX; i++) {
            for (var j = fromY; j < toY; j++) {
                if (this.matrix[i][j] == 1) return false;
            }
        }
        return true;
    }

    resetMatrix () {
        this.matrix = Utils.createMatrix();
    }

    cleanField () {
        var parent  = this.element,
            id      = parent.getAttribute('id'),
            divs    = document.querySelectorAll('#' + id + ' > div');

        [].forEach.call(divs, function(el) {
            parent.removeChild(el);
        });
        // очищаем массив объектов кораблей
        this.squadron.length = 0;
    }

    hideShips () {
        let element = this.element;
        let hiddenShips = this.hiddenShips;
        let ships = element.querySelectorAll('div.ship');
        for (let ship of ships) {
            hiddenShips.push(element.removeChild(ship));
        }
    }

    showShips () {
        var element = this.element;
        var hiddenShips = this.hiddenShips;
        for (let ship of hiddenShips) {
            element.appendChild(ship);
        }
        hiddenShips = [];
    }

    getShipByCoord (coords) {
        let arrayDescks;
        for (let i = this.squadron.length - 1; i >= 0; i--) {
            arrayDescks = this.squadron[i].matrix; // массив с координатами палуб корабля
            for (let j = 0; j < arrayDescks.length; j++) {
                if (arrayDescks[j][0] == coords.x && arrayDescks[j][1] == coords.y) {
                    return this.squadron[i];
                }
            }
        }
    }

    deleteShip (ship) {
        for (let i = 0; i < this.squadron.length; i++) {
            if (this.squadron[i] === ship) {
                this.squadron.splice(i, 1);
                break;
            }
        }
    }

    hasShips () {
        return !!this.squadron.length;
    }
};