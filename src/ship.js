'use strict';

// import utils from 'utils';

export default class Ship {
    constructor (field, config) {
        this.field = field;
        this.name = config.shipname;
        this.decks = config.decks;
        this.x0 = config.x;
        this.y0 = config.y;
        this.kx = config.kx;
        this.ky = config.ky;
        this.hits = 0;
        this.sunk = false;
        this.matrix = [];
    }

    createShip () {
        var k = 0;
        while (k < this.decks) {
            var x = this.x0 + k * this.kx;
            var y = this.y0 + k * this.ky;
            // записываем координаты корабля в матрицу игрового поля
            console.log('x: ' + x + ' y: ' + y)
            this.field.matrix[x][y] = 1;
            // записываем координаты корабля в матрицу экземпляра корабля
            this.matrix.push([x, y]);
            k++;
        }

        this.field.squadron.push(this);
        this.showShip();
        // if (player == user) this.showShip();
        //TODO обработать нормально
        if (this.field.squadron.length == 10) {
            document.getElementById('play').setAttribute('data-hidden', 'false');
        }
    }

    showShip () {
        var div = document.createElement('div'),
            dir = (this.kx == 1) ? ' vertical' : '',
            classname = this.name.slice(0, -1),
            field = this.field;

        var left = this.y0 * this.field.shipSize;
        var top = this.x0 * this.field.shipSize;
        div.setAttribute('id', this.name);
        div.className = 'ship ' + classname + dir;
        div.style.cssText = 'left:' + left + 'px; top:' + top + 'px;';
        this.field.element.appendChild(div);
    }
}