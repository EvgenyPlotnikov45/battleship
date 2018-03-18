'use strict';

import Field from 'field';
import Utils from 'utils';
import Ship from 'ship';

export default class Configurator {

    constructor(field) {
        this.pressed = false;
        this.field = field;
    }

    /**
     * Генерация разметки конфигуратора
     */
    generateConfiguratorMarkup() {
        let tpl = require('./templates/configurator.tpl');
        let templater = require('lodash.template');
        let compile = templater(tpl);
        let mainContainer = document.getElementById('main');
        mainContainer.insertAdjacentHTML('beforeEnd', compile());
    }

    /**
     * Генерация коллекции кораблей, на основе полученных данных от пользователя.
     */
    generateShipCollection () {
        let shipsData = this.field.shipsData;
        let shipsContainer = document.getElementById('initial_ships');
        shipsContainer.innerHTML = '';
        for (let i = 0; i < shipsData.length; i++) {
            let shipConfig = shipsData[i];
            let li = document.createElement('li');
            for (let j = 0; j < shipConfig.amount; j++) {
                let shipElement = document.createElement('div');
                shipElement.setAttribute('id', shipConfig.type + (j+1));
                shipElement.classList.add('ship');
                shipElement.classList.add(shipConfig.type);
                li.appendChild(shipElement);
            }

            shipsContainer.appendChild(li);
        }
    }

    /**
     * Подписываемся на кнопки выбора типа расстановки кораблей.
     * @param  {Field}
     */
    startConfigure(field) {
        let typePlacement = document.getElementById('type_placement');
        typePlacement.addEventListener('click', this.onTypePlacementClick.bind(this));
    }

    /**
     * Обработка нажатия на элемент выбора расстановки кораблей: "Автоматически" или "Ручная"
     * @param  {Event}
     */
    onTypePlacementClick (e) {
        let el = e.target;
        if (el.tagName != 'SPAN') return;
        let shipsCollection = document.getElementById('ships_collection');
        // очищаем матрицу
        this.field.cleanField();
        this.field.resetMatrix();
        this.setObserver();

        if (el.getAttribute('data-target') === 'random') {
            shipsCollection.setAttribute('data-hidden', true);
            this.field.randomLocationShips();
        } else {
            this.generateShipCollection();
            shipsCollection.setAttribute('data-hidden', false);
        }
    }

    /**
     * Установки слушателей
     */
    setObserver () {
        if (!this.hasObservers) {
            this.hasObservers = true;
            let userField = this.field.element;
            let initialShips = document.getElementById('ships_collection');
            let playBtn = document.getElementById('play');

            userField.onmousedown = this.onMouseDown.bind(this);
            userField.oncontextmenu = this.rotationShip.bind(this);
            initialShips.onmousedown = this.onMouseDown.bind(this);
            document.onmousemove = this.onMouseMove.bind(this);
            document.onmouseup = this.onMouseUp.bind(this);
            playBtn.onmouseup = this.onPlayBtnMouseUp.bind(this);
        }
    }

    /**
     * При нажатии на кнопку play мы завершаем конфигурирование, поэтому
     * скидываем все обработчики и очищаем инструкцию
     */
    onPlayBtnMouseUp () {
        this.field.element.onmousedown = null;
        this.field.element.oncontextmenu = null;
        document.getElementById('ships_collection').onmousedown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        document.getElementById('play').onmouseup = null;
        document.getElementById('instruction').remove();
        this.field.hide();
    }

    /**
     * При нажатии на корабль, начинаем процес его перетаскивания
     * @param  {Event}
     */
    onMouseDown (e) {
        if (e.which != 1) return false;

        let el = e.target.closest('.ship');
        if (!el) return;
        this.pressed = true;

        // запоминаем переносимый объект и его свойства
        this.draggable = {
            elem: el,
            downX: e.pageX,
            downY: e.pageY,
            kx: 0,
            ky: 1
        };

        // нажатие мыши произошло по установленному кораблю, находящемуся
        // в игровом поле юзера (редактирование положения корабля)
        if (el.parentElement.getAttribute('id') == this.field.element.getAttribute('id')) {
            let name = el.getAttribute('id');
            this.getDirectionShip(name);
            let computedStyle = window.getComputedStyle(el);
            this.draggable.left = computedStyle.left.slice(0, -2);
            this.draggable.top  = computedStyle.top.slice(0, -2);
            this.cleanShip(el);
        }

        return false;
    }

    /**
     * Обработчик движения мышкой, синхронизируем координаты корабля держа его под курсором.
     * @param  {Event}
     */
    onMouseMove (e) {
        if (this.pressed == false || !this.draggable.elem) return;

        if (!this.clone) {
            this.clone = this.createClone(e);
            // если не удалось создать clone
            if (!this.clone) return;
            
            let coords = Utils.getCoords(this.clone);
            this.shiftX = this.draggable.downX - coords.left;
            this.shiftY = this.draggable.downY - coords.top;

            this.startDrag(e);
            this.decks = this.getDecksClone();
        }

        let user = this.field;
        // координаты сторон аватара
        let currLeft = e.pageX - this.shiftX,
            currTop = e.pageY - this.shiftY,
            currBtm = (this.draggable.kx == 0) ? currTop + user.shipSize : currTop + user.shipSize * this.decks,
            currRight = (this.draggable.ky == 0) ? currLeft + user.shipSize : currLeft + user.shipSize * this.decks;

        this.clone.style.left = currLeft + 'px';
        this.clone.style.top = currTop + 'px';

        if (currLeft >= user.elementY &&
            currRight <= user.elementRight &&
            currTop >= user.elementX &&
            currBtm <= user.elementBtm) {
            // получаем координаты привязанные в сетке поля и в координатах матрицы
            let coords = this.getCoordsClone(this.decks);
            // проверяем валидность установленных координат
            let result = user.checkLocationShip(coords.x, coords.y, this.draggable.kx, this.draggable.ky, this.decks);

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

    /**
     * Устанавливаем клон корабля на поле.
     * @param  {Event}
     */
    onMouseUp (e) {
        let user = this.field;
        this.pressed = false;
        if (this.clone) {
            let dropElem = this.findDroppable(e);

            // если корабль пытаются поставить в запретные координаты, то возвращаем
            // его в первоначальное место: или '#user_field' или '#initial_ships'
            if (this.clone.classList.contains('unsuccess')) {
                document.querySelector('.unsuccess').classList.remove('unsuccess');
                this.clone.rollback();

                if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
                    this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
                } else {
                    this.removeClone();
                    return;
                }
            }

            if (dropElem && dropElem == user.element || this.draggable.left !== undefined && this.draggable.top !== undefined) {
                // получаем координаты привязанные в сетке поля и в координатах матрицы
                let coords = this.getCoordsClone(this.decks);

                user.element.appendChild(this.clone);
                // this.x0 = coords.x;
                // this.y0 = coords.y;
                this.clone.style.left = coords.left + 'px';
                this.clone.style.top = coords.top + 'px';
                let ship = new Ship(user, {
                    'shipname': this.clone.getAttribute('id'),
                    'x': coords.x,
                    'y': coords.y,
                    'kx': this.draggable.kx,
                    'ky': this.draggable.ky,
                    'decks': this.decks
                });
                ship.createShip();
                document.getElementById(ship.name).style.zIndex = null;
                user.element.removeChild(this.clone);
            } else {
                this.clone.rollback();
                if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
                    this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
                }
            }
            this.removeClone();
        }
        return false;
    }

    /**
     * Создание клона
     * @return {Object}
     */
    createClone () {
        let avatar = this.draggable.elem;
        let old = {
            parent: avatar.parentNode,
            nextSibling: avatar.nextSibling,
            left: avatar.left || '',
            top: avatar.top || '',
            zIndex: avatar.zIndex || ''
        };

        avatar.rollback = function() {
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex;
        };

        return avatar;
    }

    /**
     * Начинаем перетаскивание
     * @param  {Event}
     */
    startDrag (e) {
        document.body.appendChild(this.clone);
        this.clone.style.zIndex = 1000;
    }

    /**
     * Определение элемента, куда опускается корабль
     * @param  {Event}
     * @return {DOMElement}
     */
    findDroppable (e) {
        this.clone.hidden = true;
        let el = document.elementFromPoint(e.clientX, e.clientY);
        this.clone.hidden = false;
        return el.closest('.ships');
    }

    /**
     * Возвращаем размер клона корабля
     * @return {Number}
     */
    getDecksClone () {
        let type = this.clone.getAttribute('id').slice(0, -1);
        let data = this.field.shipsData;
        for (let i = 0; i < data.length; i++) {
            if (data[i].type === type) {
                return data[i].size;
            }
        }
    }

    /**
     * Метод возвращает координаты матрицы клона
     * @param  {Number}
     * @return {Object}
     */
    getCoordsClone (decks) {
        let user = this.field,
            pos = this.clone.getBoundingClientRect(),
            left = pos.left - user.elementY,
            right = pos.right - user.elementY,
            top = pos.top - user.elementX,
            bottom = pos.bottom - user.elementX,
            coords = {};

        coords.left = (left < 0) ? 0 : (right > user.size) ? user.size - user.shipSize * decks : left;
        coords.left = Math.round(coords.left / user.shipSize) * user.shipSize;
        coords.top = (top < 0) ? 0 : (bottom > user.fieldSide) ? user.fieldSize - user.shipSize : top;
        coords.top = Math.round(coords.top / user.shipSize) * user.shipSize;
        coords.x = coords.top / user.shipSize;
        coords.y = coords.left / user.shipSize;

        return coords;
    }

    /**
     * Удаление клона
     */
    removeClone () {
        delete this.clone;
        delete this.draggable;
    }

    /**
     * Поворот корабля, если это возможно
     * @param  {Event}
     */
    rotationShip (e) {
        if (e.which != 3) return false;
        e.preventDefault();
        e.stopPropagation();
        let id = e.target.getAttribute('id');
        let user = this.field;
        // ищем корабль, у которого имя совпадает с полученным id
        for (let i = 0; i < user.squadron.length; i++) {
            let data = user.squadron[i];
            if (data.name == id && data.decks != 1) {
                let kx  = (data.kx == 0) ? 1 : 0;
                let ky  = (data.ky == 0) ? 1 : 0;

                // удаляем экземпляр корабля
                this.cleanShip(e.target);
                user.element.removeChild(e.target);

                // проверяем валидность координат
                let result = user.checkLocationShip(data.x0, data.y0, kx, ky, data.decks);
                if (result === false) {
                    let kx  = (kx == 0) ? 1 : 0;
                    let ky  = (ky == 0) ? 1 : 0;
                }

                let ship = new Ship(user, {
                    'shipname': data.name,
                    'x': data.x0,
                    'y': data.y0,
                    'kx': kx,
                    'ky': ky,
                    'decks': data.decks
                });
                ship.createShip();
                if (!result) {
                    let el = document.getElementById(ship.name);
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

    /**
     * 
     * @param  {DOMElement}
     * @return {[type]}
     */
    cleanShip (el) {
        // получаем координаты в матрице
        let coords = el.getBoundingClientRect(),
            user = this.field,
            x = Math.round((coords.top - user.elementX) / user.shipSize),
            y = Math.round((coords.left - user.elementY) / user.shipSize),
            data, k;

        // ищем корабль, которому принадлежат данные координаты
        for (let i = 0; i < user.squadron.length; i++) {
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
        let data;
        let user = this.field;
        for (let i = 0; i < user.squadron.length; i++) {
            data = user.squadron[i];
            if (data.name === shipname) {
                this.draggable.kx = data.kx;
                this.draggable.ky = data.ky;
                return;
            }
        }
    }
}