'use strict';

import Utils from 'utils';
import Field from 'field';
import Computer from 'computer';

export default class BattleController {
    constructor (players) {
        this.index = 0;
        this.players = players;
        this.user = players[0];
        this.comp = players[1];
        console.log(this.user instanceof Field);
        console.log(this.comp instanceof Computer);
        // if (this.player === this.user) {
        //     // устанавливаем обработчики событий для пользователя
        //     this.comp.element.onclick = this.shoot.bind(this);
        //     this.showServiseText('Вы стреляете первым.');
        // } else {
        //     this.showServiseText('Первым стреляет компьютер.');
        //     setTimeout(() => this.shoot(), 500);
        // }
    }

    startBattle () {
        let players = this.players;
        //TODO нужно рандомно отсортировать массив players
        this.nextStep();
    }

    nextStep () {
        let index = this.index % this.players.length;
        let currentPlayer = this.players[index];
        if (currentPlayer instanceof Computer) {
            // this.showServiseText('Первым стреляет компьютер.');
            this.enemy = this.players[0];
            setTimeout(() => this.shoot(), 500);
        } else {
            // устанавливаем обработчики событий для пользователя
            for (let player of this.players) {
                if (player !== currentPlayer) {
                    player.element.onclick = this.shoot.bind(this);
                }
            }
            // this.showServiseText('Вы стреляете первым.');
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

    shoot (e) {
        // e !== undefined - значит выстрел производит игрок
        // координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
        if (e !== undefined) {
            if (e.which != 1) return false;
            // получаем координаты выстрела
            this.enemy = this.getFieldByElement(e.currentTarget);
            this.coords = this.transformCoordinates(e, this.enemy);
        } else {
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

    alreadyHitting () {
        if (this.player == this.user) {
            var text = 'По этим координатам уже стреляли';
            this.showServiseText(text);
        }
    }

    hitting () {
        this.enemy.matrix[this.coords.x][this.coords.y] = 4;
        this.showIcons(this.enemy, this.coords, 'red-cross');

        // вносим изменения в массив эскадры
        // необходимо найти корабль, в который попали
        var warship, arrayDescks;
        for (var i = this.enemy.squadron.length - 1; i >= 0; i--) {
            warship = this.enemy.squadron[i]; // вся информация о карабле эскадры
            arrayDescks = warship.matrix; // массив с координатами палуб корабля

            for (var j = 0; j < arrayDescks.length; j++) {
                // если координаты одной из палуб корабля совпали с координатами выстрела
                // увеличиванием счётчик попаданий
                if (arrayDescks[j][0] == this.coords.x && arrayDescks[j][1] == this.coords.y) {
                    warship.hits++;
                    // если кол-во попаданий в корабль становится равным кол-ву палуб
                    // считаем этот корабль уничтоженным и удаляем его из эскадры
                    if (warship.hits == warship.decks) {
                        this.enemy.squadron.splice(i, 1);
                    } else {
                        var text = (this.player === this.user) ? 'Поздравляем! Вы попали. Ваш выстрел.' : 'Компьютер попал в ваш корабль. Выстрел компьютера';
                        this.showServiseText(text);
                    }
                    break;
                }
            }
        }

        // игра закончена, все корбали эскадры противника уничтожены
        if (this.enemy.squadron.length == 0) {
            var text = (this.player === this.user) ? 'Поздравляем! Вы выиграли.' : 'К сожалению, вы проиграли.';
            this.showServiseText(text);

            if (this.player == this.user) {
                // снимаем обработчики событий для пользователя
                this.comp.element.onclick = null;
            } else {
                //если выиграл комп., показываем оставшиеся корабли компьютера
                this.comp.showShips();
            }
        // бой продолжается
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

    missing () {
        // устанавливаем иконку промаха и записываем промах в матрицу
        this.showIcons(this.enemy, this.coords, 'dot');
        this.enemy.matrix[this.coords.x][this.coords.y] = 3;

        var text = (this.player === this.user) ? 'Вы промахнулись. Стреляет компьютер.' : 'Компьютер промахнулся. Ваш выстрел.';
        this.showServiseText(text);

        // определяем, чей выстрел следующий
        this.player = (this.player === this.user) ? this.comp : this.user;
        this.enemy = (this.player === this.user) ? this.comp : this.user;

        if (this.player == this.comp) {
            // снимаем обработчики событий для пользователя
            this.comp.element.onclick = null;
            setTimeout(() => this.shoot(), 500);
        } else {
            // устанавливаем обработчики событий для пользователя
            this.comp.element.onclick = this.shoot.bind(this);
        }
    }

    transformCoordinates (e, instance) {
        var obj = {};
        obj.x = Math.trunc((e.pageY - instance.elementX) / instance.shipSize),
        obj.y = Math.trunc((e.pageX - instance.elementY) / instance.shipSize);
        return obj;
    }

    showIcons (enemy, coords, iconClass) {
        var iconField = document.createElement('div');
        var sumbol = document.createElement('div');
        iconField.className = 'icon-field';
        sumbol.className = iconClass;
        iconField.style.cssText = 'left:' + (coords.y * this.enemy.shipSize) + 'px; top:' + (coords.x * this.enemy.shipSize) + 'px;';
        iconField.appendChild(sumbol);
        this.enemy.element.appendChild(iconField);
    }

    showServiseText (text) {
        var srvText = document.getElementById('text_btm');
        srvText.innerHTML = '';
        srvText.innerHTML = text;
    }
};