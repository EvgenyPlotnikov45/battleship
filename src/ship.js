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
        let k = 0;
        while (k < this.decks) {
            let x = this.x0 + k * this.kx;
            let y = this.y0 + k * this.ky;
            // записываем координаты корабля в матрицу игрового поля
            this.field.matrix[x][y] = 1;
            // записываем координаты корабля в матрицу экземпляра корабля
            this.matrix.push([x, y]);
            k++;
        }

        this.field.squadron.push(this);
        this.showShip();
        //TODO обработать нормально
        if (this.field.squadron.length == 10) {
            document.getElementById('play').setAttribute('data-hidden', 'false');
        }
    }

    showShip () {
        let div = document.createElement('div'),
            dir = (this.kx == 1) ? ' vertical' : '',
            classname = this.name.slice(0, -1),
            field = this.field;

        let left = this.y0 * this.field.shipSize;
        let top = this.x0 * this.field.shipSize;
        div.setAttribute('id', this.name);
        div.className = 'ship ' + classname + dir;
        div.style.cssText = 'left:' + left + 'px; top:' + top + 'px;';
        this.field.element.appendChild(div);
    }
}