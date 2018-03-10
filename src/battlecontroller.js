'use strict';

import Utils from 'utils';
import User from 'user';
import Computer from 'computer';

export default class BattleController {

    constructor (players) {
        this.index = 0;
        this.players = players;
        this.player = null;
        this.enemy = null;
        this.coords = null;
        console.log(this.players)
    }

    /**
     * Рандомно перемешиваем массив с игроками, для определения первого хода.
     * И зпускаем первый ход.
     */
    startBattle () {
        this.players.sort(() => Math.random() - 0.5);
        this.nextStep();
    }

    /**
     * Метод определяет, какой игрок ходит случающим и запускает ход данного игрока.
     * Так же выполняется проверка на окончание игры.
     */
    nextStep () {
        if (this.player && this.player instanceof User) this.clearEvents();
        if (this.checkEndGame()) return;

        let index = this.index % this.players.length;
        this.player = this.players[index];
        this.index++;

        if (!this.player.active) {
            this.nextStep();
        }

        if (this.player instanceof Computer) {
            setTimeout(() => this.shoot(), 500);
        } else {
            // устанавливаем обработчики событий для пользователя
            this.listenEvents();
        }

        this.showText(`Игрок ${this.player.fullName} стреляет.`);
    }

    /**
     * Проверка окончания игры, если остались активные игроки, то игра продолжается.
     * Если активный игрок только один, то игра заканчивается.
     * @return {Boolean}
     */
    checkEndGame () {
        let activePlayers = 0;
        for (let player of this.players) {
            if (player.active) activePlayers++;
        }

        if (activePlayers > 1) {
            return false;
        } else {
            this.showText(`Игрок ${this.player.fullName} победил.`);
            return true;
        }
    }

    /**
     * Подписываем игрока на клик по полям других игроков.
     */
    listenEvents () {
        for (let player of this.players) {
            if (player !== this.player && player.active) {
                player.element.onclick = this.shoot.bind(this);
            }
        }
    }

    /**
     * Очищаем обработчики событий
     * @return {Field}
     */
    clearEvents () {
        for (let player of this.players) {
            player.element.onclick = null;
        }
    }

    /**
     * По элементу определяем и возвращаем обьект игрока
     * @param  {HTMLElement}
     * @return {Field}
     */
    getFieldByElement (element) {
        let players = this.players;
        for (let player of players) {
            if (player.element === element) {
                return player;
            }
        }
    }

    /**
     * Функция обработки выстрела
     * @param  {Event}
     */
    shoot (e) {
        // e !== undefined - значит выстрел производит игрок
        // координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
        if (e !== undefined) {
            if (e.which != 1) return false;
            this.enemy = this.getFieldByElement(e.currentTarget);
            // получаем координаты выстрела
            this.coords = this.transformCoordinates(e.pageX, e.pageY);
        } else {
            this.enemy = this.player.getEnemy(this.players);
            // генерируются матричные координаты выстрела компьютера
            this.coords = this.player.getCoordinates();
        }

        var matrixValue = this.enemy.matrix[this.coords.x][this.coords.y];
        switch(matrixValue) {
            // промах
            case 0:
                this.missing();
                break;
            // попадание
            case 1:
                this.hitting();
                break;
            // обстрелянная координата
            case 2:
            case 3:
            case 4:
                this.alreadyHitting();
                break;
        }
    }

    /**
     * Обработка случая с промахом.
     */
    missing () {
        // устанавливаем иконку промаха и записываем промах в матрицу
        Utils.showIcons(this.enemy, this.coords, 'dot');
        this.enemy.matrix[this.coords.x][this.coords.y] = 3;

        this.showText(`Игрок ${this.player.fullName} промахнулся.`);
        this.nextStep();
    }

    /**
     * Обработка случая, когда по данной клетке уже стреляли.
     */
    alreadyHitting () {
        if (this.player instanceof User) {
            this.showText('По этим координатам уже стреляли.');
        } else {
            this.player.actualizeMatrixData(this.coords);
            this.shoot();
        }
    }

    /**
     * Обработка попадания по кораблю.
     */
    hitting () {
        this.enemy.matrix[this.coords.x][this.coords.y] = 4;
        Utils.showIcons(this.enemy, this.coords, 'red-cross');

        // вносим изменения в массив кораблей
        // необходимо найти корабль, в который попали
        let ship = this.enemy.getShipByCoord(this.coords);
        ship.hits++;
        // если кол-во попаданий в корабль становится равным кол-ву палуб
        // считаем этот корабль уничтоженным и удаляем его
        if (ship.hits == ship.decks) {
            this.enemy.deleteShip(ship);
        }

        this.showText(`Игрок ${this.player.fullName} попал в игрока ${this.enemy.fullName}`);

        if (!this.enemy.hasShips()) {
            this.enemy.active = false;
            this.checkEndGame();
        } else {
            if (this.player instanceof Computer) {
                // отмечаем клетки, где точно не может стоять корабль
                this.player.markUnnecessaryCell(this.coords, this.enemy);
                // обстрел клеток вокруг попадания
                this.player.getNeedCoordinatesShot(this.coords, this.enemy);  
                // производим новый выстрел
                setTimeout(() => this.shoot(), 500);
            }
        }
    }

    /**
     * Трансформирование координат страницы в координаты поля противника
     * @param  {Number} pageX
     * @param  {Number} pageY
     * @return {Object}
     */
    transformCoordinates (pageX, pageY) {
        var obj = {};
        obj.x = Math.trunc((pageY - this.enemy.elementX) / this.enemy.shipSize),
        obj.y = Math.trunc((pageX - this.enemy.elementY) / this.enemy.shipSize);
        return obj;
    }

    /**
     * Отображение текста внизу экрана.
     * @param  {String}
     */
    showText (text) {
        document.getElementById('text_btm').innerHTML = text;
    }
};