'use strict';

import Field from 'field';
import Utils from 'utils';

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
                '1. <span class="link" data-target="random">Случайным образом</span><br>' +
                '2. <span class="link" data-target="manually">Самостоятельно с чистого листа.</span>' +
            '</div>' +
            '<div id="ships_collection" class="ships-collection" data-hidden="true">' +
                '<p>Перетащите мышкой корабли на игровое поле. Для установки корабля по вертикали, кликните по нему правой кнопкой мышки.</p>' +
                '<ul id="initial_ships" class="initial-ships">' +
                    '<li>' +
                        '<div id="fourdeck1" class="ship fourdeck"></div>' +
                        '<div id="tripledeck1" class="ship tripledeck tripledeck1"></div>' +
                        '<div id="tripledeck2" class="ship tripledeck tripledeck2"></div>' +
                    '</li>' +
                    '<li>' +
                        '<div id="doubledeck1" class="ship doubledeck"></div>' +
                        '<div id="doubledeck2" class="ship doubledeck doubledeck2"></div>' +
                        '<div id="doubledeck3" class="ship doubledeck doubledeck3"></div>' +
                    '</li>' +
                    '<li>' +
                        '<div id="singledeck1" class="ship singledeck"></div>' +
                        '<div id="singledeck2" class="ship singledeck singledeck2"></div>' +
                        '<div id="singledeck3" class="ship singledeck singledeck3"></div>' +
                        '<div id="singledeck4" class="ship singledeck singledeck4"></div>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
        '</div>');
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
        this.field.cleanField();

        var type = el.getAttribute('data-target'),
            typeGeneration = {
                'random': function() {
                    shipsCollection.setAttribute('data-hidden', true);
                    me.field.randomLocationShips();
                },
                'manually': function() {
                    // this.field.matrix = utils.createMatrix();
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

        // посчитать дистанцию, на которую переместился курсор мыши
        /*var moveX = e.pageX - this.draggable.downX,
            moveY = e.pageY - this.draggable.downY;
        if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;*/

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

        if (currLeft >= user.fieldY - 14 && currRight <= user.fieldRight + 14 && currTop >= user.fieldX - 14 && currBtm <= user.fieldBtm + 14) {
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

            if (dropElem && dropElem == user.field || this.draggable.left !== undefined && this.draggable.top !== undefined) {
                // получаем координаты привязанные в сетке поля и в координатах матрицы
                var coords = this.getCoordsClone(this.decks);

                user.field.appendChild(this.clone);
                // this.x0 = coords.x;
                // this.y0 = coords.y;
                this.clone.style.left = coords.left + 'px';
                this.clone.style.top = coords.top + 'px';

                // создаём экземпляр корабля
                var fc = {
                        'shipname': this.clone.getAttribute('id'),
                        'x': coords.x,
                        'y': coords.y,
                        'kx': this.draggable.kx,
                        'ky': this.draggable.ky,
                        'decks': this.decks
                    },
                    ship = new Ships(user, fc);
                ship.createShip();
                getElement(ship.shipname).style.zIndex = null;
                getElement('field_user').removeChild(this.clone);
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
        var pos     = this.clone.getBoundingClientRect(),
            left    = pos.left - user.fieldY,
            right   = pos.right - user.fieldY,
            top     = pos.top - user.fieldX,
            bottom  = pos.bottom - user.fieldX,
            coords  = {};

        coords.left = (left < 0) ? 0 : (right > user.fieldSide) ? user.fieldSide - user.shipSide * decks : left;
        coords.left = Math.round(coords.left / user.shipSide) * user.shipSide;
        coords.top  = (top < 0) ? 0 : (bottom > user.fieldSide) ? user.fieldSide - user.shipSide : top;
        coords.top  = Math.round(coords.top / user.shipSide) * user.shipSide;
        coords.x    = coords.top / user.shipSide;
        coords.y    = coords.left / user.shipSide;

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

        // ищем корабль, у которого имя совпадает с полученным id
        for (var i = 0, length = this.field.squadron.length; i < length; i++) {
            var data = user.squadron[i];
            if (data.shipname == id && data.decks != 1) {
                var kx  = (data.kx == 0) ? 1 : 0,
                    ky  = (data.ky == 0) ? 1 : 0;

                // удаляем экземпляр корабля
                this.cleanShip(e.target);
                this.field.element.removeChild(e.target);

                // проверяем валидность координат
                var result = this.field.checkLocationShip(data.x0, data.y0, kx, ky, data.decks);
                if (result === false) {
                    var kx  = (kx == 0) ? 1 : 0,
                        ky  = (ky == 0) ? 1 : 0;
                }
                // создаём экземпляр корабля
                var fc = {
                        'shipname': data.shipname,
                        'x': data.x0,
                        'y': data.y0,
                        'kx': kx,
                        'ky': ky,
                        'decks': data.decks
                    },
                    ship = new Ship(user, fc);

                ship.createShip();
                if (result === false) {
                    var el = getElement(ship.shipname);
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

    cleanShip () {
        // получаем координаты в матрице
        var coords = el.getBoundingClientRect(),
            x = Math.round((coords.top - user.fieldX) / user.shipSide),
            y = Math.round((coords.left - user.fieldY) / user.shipSide),
            data, k;

        // ищем корабль, которому принадлежат данные координаты
        for (var i = 0, length = user.squadron.length; i < length; i++) {
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

    getDirectionShip () {
        var data;
        for (var i = 0, length = user.squadron.length; i < length; i++) {
            data = user.squadron[i];
            if (data.shipname === shipname) {
                this.draggable.kx = data.kx;
                this.draggable.ky = data.ky;
                return;
            }
        }
    }
}