'use strict';

import Field from 'field';
import Utils from 'utils';
import Ship from 'ship';

export default class Configurator {

    constructor() {
        this.pressed = false;
        this.field = null;
    }

    generateConfiguratorMarkup() {
        var mainContainer = document.getElementById('main');
        mainContainer.insertAdjacentHTML('afterBegin', '' +
        '<div class="field field-user">' +
            '<div id="field_user" class="ships"></div>' +
        '</div>' +
        '<div id="instruction" class="instruction" data-hidden="false">' +
            '<div id="type_placement" class="type-placement-box">' +
                '<span class="link" data-target="random">Расставить автоматически</span><br>' +
                '<span class="link" data-target="manually">Ручная расстановка</span>' +
            '</div>' +
            '<div id="ships_collection" class="ships-collection" data-hidden="true">' +
                '<p>Перетащите мышкой корабли на игровое поле. Для установки корабля по вертикали, кликните по нему правой кнопкой мышки.</p>' +
                '<ul id="initial_ships" class="initial-ships">' +
                '</ul>' +
            '</div>' +
        '</div>');
    }

    generateShipCollection () {
        var shipsData = this.field.shipsData;
        var shipsContainer = document.getElementById('initial_ships');
        shipsContainer.innerHTML = '';
        for (var i = 0; i < shipsData.length; i++) {
            var shipConfig = shipsData[i];
            var li = document.createElement('li');
            for (var j = 0; j < shipConfig.amount; j++) {
                var shipElement = document.createElement('div');
                shipElement.setAttribute('id', shipConfig.type + (j+1));
                shipElement.classList.add('ship');
                shipElement.classList.add(shipConfig.type);
                li.appendChild(shipElement);
            }

            shipsContainer.appendChild(li);
        }
    }

    startConfigure() {
        var fieldElement = document.getElementById('field_user');
        this.field = new Field(fieldElement);
        var typePlacement = document.getElementById('type_placement');
        typePlacement.addEventListener('click', this.onTypePlacementClick.bind(this));
    }

    onTypePlacementClick (e) {
        var me = this;
        var el = e.target;
        if (el.tagName != 'SPAN') return;
        var shipsCollection = document.getElementById('ships_collection');
        document.getElementById('play').setAttribute('data-hidden', true);
        // очищаем матрицу
        me.field.cleanField();
        me.field.resetMatrix();

        var type = el.getAttribute('data-target'),
            typeGeneration = {
                'random': function() {
                    shipsCollection.setAttribute('data-hidden', true);
                    me.field.randomLocationShips();
                },
                'manually': function() {
                    me.generateShipCollection();
                    if (shipsCollection.getAttribute('data-hidden') === 'true') {
                        shipsCollection.setAttribute('data-hidden', false);
                        me.setObserver();
                    } else {
                        shipsCollection.setAttribute('data-hidden', true);
                    }
                }
            };
        typeGeneration[type]();
    }

    setObserver () {
        var fieldUser = document.getElementById('field_user'),
            initialShips = document.getElementById('ships_collection');

        fieldUser.addEventListener('mousedown', this.onMouseDown.bind(this));
        fieldUser.addEventListener('contextmenu', this.rotationShip.bind(this));
        initialShips.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown (e) {
        if (e.which != 1) return false;

        var el = e.target.closest('.ship');
        if (!el) return;
        this.pressed = true;

        // запоминаем переносимый объект и его свойства
        this.draggable = {
            elem:   el,
            //запоминаем координаты, с которых начат перенос
            downX:  e.pageX,
            downY:  e.pageY,
            kx:     0,
            ky:     1
        };

        // нажатие мыши произошло по установленному кораблю, находящемуся
        // в игровом поле юзера (редактирование положения корабля)
        if (el.parentElement.getAttribute('id') == 'field_user') {
            var name = el.getAttribute('id');
            this.getDirectionShip(name);

            var computedStyle   = getComputedStyle(el);
            this.draggable.left = computedStyle.left.slice(0, -2);
            this.draggable.top  = computedStyle.top.slice(0, -2);

            this.cleanShip(el);
        }
        return false;
    }

    onMouseMove (e) {
        if (this.pressed == false || !this.draggable.elem) return;

        if (!this.clone) {
            this.clone = this.creatClone(e);
            // еслине удалось создать clone
            if (!this.clone) return;
            
            var coords = Utils.getCoords(this.clone);
            this.shiftX = this.draggable.downX - coords.left;
            this.shiftY = this.draggable.downY - coords.top;

            this.startDrag(e);
            this.decks = this.getDecksClone();
        }

        var user = this.field;
        // координаты сторон аватара
        var currLeft    = e.pageX - this.shiftX,
            currTop     = e.pageY - this.shiftY,
            currBtm     = (this.draggable.kx == 0) ? currTop + user.shipSize : currTop + user.shipSize * this.decks,
            currRight   = (this.draggable.ky == 0) ? currLeft + user.shipSize : currLeft + user.shipSize * this.decks;

        this.clone.style.left = currLeft + 'px';
        this.clone.style.top = currTop + 'px';

        if (currLeft >= user.elementY &&
            currRight <= user.elementRight &&
            currTop >= user.elementX &&
            currBtm <= user.elementBtm) {
            // получаем координаты привязанные в сетке поля и в координатах матрицы
            var coords = this.getCoordsClone(this.decks);
            // проверяем валидность установленных координат
            var result = user.checkLocationShip(coords.x, coords.y, this.draggable.kx, this.draggable.ky, this.decks);

            if (result) {
                this.clone.classList.remove('unsuccess');
                this.clone.classList.add('success');
            } else {
                this.clone.classList.remove('success');
                this.clone.classList.add('unsuccess');
            }
        } else {
            this.clone.classList.remove('success');
            this.clone.classList.add('unsuccess');
        }
        return false;
    }

    onMouseUp (e) {
        var user = this.field;
        this.pressed = false;
        if (this.clone) {
            var dropElem = this.findDroppable(e);

            // если корабль пытаются поставить в запретные координаты, то возвращаем
            // его в первоначальное место: или '#user_field' или '#initial_ships'
            if (this.clone.classList.contains('unsuccess')) {
                document.querySelector('.unsuccess').classList.remove('unsuccess');
                this.clone.rollback();

                if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
                    this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
                } else {
                    this.cleanClone();
                    return;
                }
            }

            if (dropElem && dropElem == user.element || this.draggable.left !== undefined && this.draggable.top !== undefined) {
                // получаем координаты привязанные в сетке поля и в координатах матрицы
                var coords = this.getCoordsClone(this.decks);

                user.element.appendChild(this.clone);
                // this.x0 = coords.x;
                // this.y0 = coords.y;
                this.clone.style.left = coords.left + 'px';
                this.clone.style.top = coords.top + 'px';

                // создаём экземпляр корабля
                var shipConfig = {
                        'shipname': this.clone.getAttribute('id'),
                        'x': coords.x,
                        'y': coords.y,
                        'kx': this.draggable.kx,
                        'ky': this.draggable.ky,
                        'decks': this.decks
                    };

                var ship = new Ship(user, shipConfig);
                ship.createShip();
                document.getElementById(ship.name).style.zIndex = null;
                document.getElementById('field_user').removeChild(this.clone);
            } else {
                this.clone.rollback();
                if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
                    this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
                }
            }
            this.cleanClone();
        }
        return false;
    }

    creatClone () {
        var avatar = this.draggable.elem,
            old = {
                parent:         avatar.parentNode,
                nextSibling:    avatar.nextSibling,
                left:           avatar.left || '',
                top:            avatar.top || '',
                zIndex:         avatar.zIndex || ''
            };

        avatar.rollback = function() {
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex;
        };
        return avatar;
    }

    startDrag (e) {
        document.body.appendChild(this.clone);
        this.clone.style.zIndex = 1000;
    }

    findDroppable (e) {
        this.clone.hidden = true;
        var el = document.elementFromPoint(e.clientX, e.clientY);
        this.clone.hidden = false;
        return el.closest('.ships');
    }

    getDecksClone () {
        var type = this.clone.getAttribute('id').slice(0, -1);
        var data = this.field.shipsData;
        for (var i = 0; i < data.length; i++) {
            if (data[i].type === type) {
                return data[i].size;
            }
        }
    }

    getCoordsClone () {
        var user = this.field,
            pos     = this.clone.getBoundingClientRect(),
            left    = pos.left - user.elementY,
            right   = pos.right - user.elementY,
            top     = pos.top - user.elementX,
            bottom  = pos.bottom - user.elementX,
            coords  = {};

        coords.left = (left < 0) ? 0 : (right > user.size) ? user.size - user.shipSize * decks : left;
        coords.left = Math.round(coords.left / user.shipSize) * user.shipSize;
        coords.top  = (top < 0) ? 0 : (bottom > user.fieldSide) ? user.fieldSize - user.shipSize : top;
        coords.top  = Math.round(coords.top / user.shipSize) * user.shipSize;
        coords.x    = coords.top / user.shipSize;
        coords.y    = coords.left / user.shipSize;

        return coords;
    }

    cleanClone () {
        delete this.clone;
        delete this.draggable;
    }

    rotationShip (e) {
        if (e.which != 3) return false;
        e.preventDefault();
        e.stopPropagation();

        var id = e.target.getAttribute('id');

        var user = this.field;
        // ищем корабль, у которого имя совпадает с полученным id
        for (var i = 0; i < user.squadron.length; i++) {
            var data = user.squadron[i];
            if (data.name == id && data.decks != 1) {
                var kx  = (data.kx == 0) ? 1 : 0,
                    ky  = (data.ky == 0) ? 1 : 0;

                // удаляем экземпляр корабля
                this.cleanShip(e.target);
                user.element.removeChild(e.target);

                // проверяем валидность координат
                var result = user.checkLocationShip(data.x0, data.y0, kx, ky, data.decks);
                if (result === false) {
                    var kx  = (kx == 0) ? 1 : 0,
                        ky  = (ky == 0) ? 1 : 0;
                }
                // создаём экземпляр корабля
                var shipConfig = {
                    'shipname': data.name,
                    'x': data.x0,
                    'y': data.y0,
                    'kx': kx,
                    'ky': ky,
                    'decks': data.decks
                };

                var ship = new Ship(user, shipConfig);
                ship.createShip();
                if (!result) {
                    var el = document.getElementById(ship.name);
                    el.classList.add('unsuccess');
                    setTimeout(function() {
                        el.classList.remove('unsuccess');
                    }, 500);
                }

                return false;
            }
        }
        return false;
    }

    cleanShip (el) {
        // получаем координаты в матрице
        var coords = el.getBoundingClientRect(),
            user = this.field,
            x = Math.round((coords.top - user.elementX) / user.shipSize),
            y = Math.round((coords.left - user.elementY) / user.shipSize),
            data, k;

        // ищем корабль, которому принадлежат данные координаты
        for (var i = 0; i < user.squadron.length; i++) {
            data = user.squadron[i];
            if (data.x0 == x && data.y0 == y) {
                // удаляем из матрицы координаты корабля
                k = 0;
                while(k < data.decks) {
                    user.matrix[x + k * data.kx][y + k * data.ky] = 0;
                    k++;
                }
                // удаляем корабль из массива 
                user.squadron.splice(i, 1);
                return;
            }
        }
    }

    getDirectionShip (shipname) {
        var data;
        var user = this.field;
        for (var i = 0; i < user.squadron.length; i++) {
            data = user.squadron[i];
            if (data.name === shipname) {
                this.draggable.kx = data.kx;
                this.draggable.ky = data.ky;
                return;
            }
        }
    }
}