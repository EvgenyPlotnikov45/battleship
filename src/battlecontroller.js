'use strict';

import Utils from 'utils';

export default class BattleController {
    constructor (players) {
        this.index = 0;
        this.players = players;
        this.user = players[0];
        this.comp = players[1];
        console.log(this.user);
        console.log(this.comp);
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
        let index = this.index % this.players.length;
        let player = players[index];

    }

    /**
     * По элементу определяем
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
            if (this.comp.needShootMatrix.length) {
                this.needShoot();
            } else {
                this.getCoordinatesShot();
            }
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
            warship     = this.enemy.squadron[i]; // вся информация о карабле эскадры
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
            if (this.player === this.comp) {
                // отмечаем клетки, где точно не может стоять корабль
                this.markUnnecessaryCell();
                // обстрел клеток вокруг попадания
                this.getNeedCoordinatesShot();  
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

    getCoordinatesShot () {
        var rnd, val;

        if (this.comp.orderedShootMatrix.length != 0) {
            if (this.comp.orderedShootMatrix.length > 10) {
                rnd = Utils.getRandom(9);
            } else {
                rnd = Utils.getRandom(this.comp.orderedShootMatrix.length - 1);
            }
            val = this.comp.orderedShootMatrix.splice(rnd, 1)[0];
        } else {
            rnd = Utils.getRandom(this.comp.shootMatrix.length - 1),
            val = this.comp.shootMatrix.splice(rnd, 1)[0];
        }

        this.coords = {
            x: val[0],
            y: val[1]
        };

        this.deleteElementMatrix(this.comp.shootMatrix, this.coords);
    }

    getNeedCoordinatesShot () {
        var kx = 0, ky = 0;

        if (Object.keys(this.comp.firstHit).length === 0) {
            this.comp.firstHit = this.coords;
        } else {
            this.comp.lastHit = this.coords;
            kx = (Math.abs(this.comp.firstHit.x - this.comp.lastHit.x) == 1) ? 1 : 0;
            ky = (Math.abs(this.comp.firstHit.y - this.comp.lastHit.y) == 1) ? 1 : 0;
            this.comp.firstHit = this.comp.lastHit;
            this.comp.lastHit = {};
        }

        if (this.coords.x > 0 && ky == 0) this.comp.needShootMatrix.push([this.coords.x - 1, this.coords.y]);
        if (this.coords.x < 9 && ky == 0) this.comp.needShootMatrix.push([this.coords.x + 1, this.coords.y]);
        if (this.coords.y > 0 && kx == 0) this.comp.needShootMatrix.push([this.coords.x, this.coords.y - 1]);
        if (this.coords.y < 9 && kx == 0) this.comp.needShootMatrix.push([this.coords.x, this.coords.y + 1]);

        for (var i = this.comp.needShootMatrix.length - 1; i >= 0; i--) {
            var x = this.comp.needShootMatrix[i][0],
                y = this.comp.needShootMatrix[i][1];
            //удаляем точки, по которым уже проводился обстрел или стрельба не имеет смысла
            if (this.user.matrix[x][y] != 0 && this.user.matrix[x][y] != 1) {
                this.comp.needShootMatrix.splice(i,1);
                this.deleteElementMatrix(this.comp.shootMatrix, this.coords);
                if (this.comp.orderedShootMatrix.length != 0) {
                    this.deleteElementMatrix(this.comp.orderedShootMatrix, this.coords);
                }
            }
        }
        return;
    }

    needShoot () {
        var val = this.comp.needShootMatrix.shift();
        this.coords = {
            x: val[0],
            y: val[1]
        }

        // удаляем координаты по которым произошел выстрел
        this.deleteElementMatrix(this.comp.shootMatrix, this.coords);
        if (this.comp.orderedShootMatrix.length != 0) {
            this.deleteElementMatrix(this.comp.orderedShootMatrix, this.coords);
        }
    }

    markUnnecessaryCell () {
        var icons   = this.user.element.querySelectorAll('.icon-field'),
            coords = this.coords,
            points  = [
                        [coords.x - 1, coords.y - 1],
                        [coords.x - 1, coords.y + 1],
                        [coords.x + 1, coords.y - 1],
                        [coords.x + 1, coords.y + 1]
                    ];

        for (var i = 0; i < 4; i++) {
            var flag = true;
            if (points[i][0] < 0 || points[i][0] > 9 || points[i][1] < 0 || points[i][1] > 9) continue; // за пределами игрового поля

            // поиск совпадения с иконкой можно реализовать и через forEach, но в этом случае
            // будет просмотренна вся коллекция иконок, к концу боя она может быть близка к 100
            // при поиске через for(), можно прервать цикл при совпадении
            for (var j = 0; j < icons.length; j++) {
                var x = icons[j].style.top.slice(0, -2) / this.user.shipSize,
                    y = icons[j].style.left.slice(0, -2) / this.user.shipSize;
                if (points[i][0] == x && points[i][1] == y) {
                    flag = false;
                    break;
                }
            }
            if (flag === false) continue;

            var obj = {
                x: points[i][0],
                y: points[i][1]
            }
            this.showIcons(this.enemy, obj, 'shaded-cell');
            this.user.matrix[obj.x][obj.y] = 2;

            // удаляем из массивов выстрелов ненужные координаты
            this.deleteElementMatrix(this.comp.shootMatrix, obj);
            if (this.comp.needShootMatrix.length != 0) {
                this.deleteElementMatrix(this.comp.needShootMatrix, obj);
            }

            if (this.comp.orderedShootMatrix.length != 0) {
                this.deleteElementMatrix(this.comp.orderedShootMatrix, obj);
            }
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

    deleteElementMatrix (array, obj) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i][0] == obj.x && array[i][1] == obj.y) {
                var el = array.splice(i, 1);
            }
        }
    }
};