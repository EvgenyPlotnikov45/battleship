'use strict';

export default class Utils {

    /**
     * Создание двуменрного массива 10 на 10 заполненого нулями
     * @return {Array}
     */
    static createMatrix () {
        let x = 10, y = 10, arr = [10];
        for (var i = 0; i < x; i++) {
            arr[i] = [10];
            for(var j = 0; j < y; j++) {
                arr[i][j] = 0;
            }
        }

        return arr;
    }

    /**
     * Возвращаем целое чисто от 0 до n включительно
     * @param  {Number} n
     * @return {Number}
     */
    static getRandom (n) {
        return Math.floor(Math.random() * (n + 1));
    }

    /**
     * Метод возвращает координаты элемента с учетом скрола страницы
     * @param  {HTMLElement} el
     * @return {Object}
     */
    static getCoords (el) {
        var coords = el.getBoundingClientRect();
        return {
            top: coords.top + window.pageYOffset,
            left: coords.left + window.pageXOffset
        };
    }

    /**
     * Создаем клетку с иконкой и добавляем её на переданное поле.
     * Иконка может быть с попаданием, или с промахом.
     * @param  {Field} enemy
     * @param  {Object} coords
     * @param  {String} iconClass
     */
    static showIcons (targetField, coords, iconClass) {
        var iconField = document.createElement('div');
        var sumbol = document.createElement('div');
        iconField.className = 'icon-field';
        sumbol.className = iconClass;
        iconField.style.cssText = 'left:' + (coords.y * targetField.shipSize) + 'px; top:' + (coords.x * targetField.shipSize) + 'px;';
        iconField.appendChild(sumbol);
        targetField.element.appendChild(iconField);
    }
};