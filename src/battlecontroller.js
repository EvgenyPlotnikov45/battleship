'use strict';

import Utils from 'utils';

export default class BattleController {
    constructor (user, comp) {
        var me = this;
        me.user = user;
        me.comp = comp;
        var rnd = Utils.getRandom(1);
        me.player = (rnd == 0) ? user : comp;
        me.enemy = (me.player === user) ? comp : user;
        // массив с координатами выстрелов при рандомном выборе
        comp.shootMatrix = [];
        // массив с координатами выстрелов для AI
        comp.orderedShootMatrix = [];
        // массив с координатами вокруг клетки с попаданием
        comp.needShootMatrix = [];
        // объекты для хранения первого и след. выстрела
        comp.firstHit = {};
        comp.lastHit = {};
        // массив значений циклов при формировании координат стрельбы
        var loopValues = [
            [1, 0, 10],
            [2, 0, 10],
            [3, 0, 10]
            //[3, 0, 5]
        ];
        me.createShootMatrix(loopValues[0]);
        for (var i = 1; i < loopValues.length; i++) {
            me.createShootMatrix(loopValues[i]);
        }
        if (me.player === me.user) {
            // устанавливаем обработчики событий для пользователя
            me.comp.element.addEventListener('click', me.shoot.bind(me));
            me.comp.element.addEventListener('contextmenu', me.setEmptyCell.bind(me));
            me.showServiseText('Вы стреляете первым.');
        } else {
            me.showServiseText('Первым стреляет компьютер.');
            setTimeout(function() {
                me.shoot();
            }, 1000);
        }
    }

    shoot (e) {
        var me = this;
        // e !== undefined - значит выстрел производит игрок
        // координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
        if (e !== undefined) {
            if (e.which != 1) return false;
            // получаем координаты выстрела
            me.coords = me.transformCoordinates(e, me.enemy);
        } else {
            // генерируются матричные координаты выстрела компьютера
            if (me.comp.needShootMatrix.length) {
                me.needShoot();
            } else {
                me.getCoordinatesShot();
            }
        }

        var val = me.enemy.matrix[me.coords.x][me.coords.y];

        // проверяем какая иконка есть в клетке с данными координатами,
        // если заштрихованная иконка, то удаляем её
        me.checkFieldCell(me.coords);

        switch(val) {
            // промах
            case 0:
                // устанавливаем иконку промаха и записываем промах в матрицу
                me.showIcons(me.enemy, me.coords, 'dot');
                me.enemy.matrix[me.coords.x][me.coords.y] = 3;

                var text = (me.player === me.user) ? 'Вы промахнулись. Стреляет компьютер.' : 'Компьютер промахнулся. Ваш выстрел.';
                me.showServiseText(text);

                // определяем, чей выстрел следующий
                me.player = (me.player === me.user) ? me.comp : me.user;
                me.enemy = (me.player === me.user) ? me.comp : me.user;

                if (me.player == me.comp) {
                    // снимаем обработчики событий для пользователя
                    me.comp.element.removeEventListener('click', me.shoot);
                    me.comp.element.removeEventListener('contextmenu', me.setEmptyCell);
                    setTimeout(function() {
                        me.shoot();
                    }, 1000);
                } else {
                    // устанавливаем обработчики событий для пользователя
                    me.comp.element.addEventListener('click', me.shoot.bind(me));
                    me.comp.element.addEventListener('contextmenu', me.setEmptyCell.bind(me));
                }
                break;

            // попадание
            case 1:
                me.enemy.matrix[me.coords.x][me.coords.y] = 4;
                me.showIcons(me.enemy, me.coords, 'red-cross');

                // вносим изменения в массив эскадры
                // необходимо найти корабль, в который попали
                var warship, arrayDescks;
                for (var i = me.enemy.squadron.length - 1; i >= 0; i--) {
                    warship     = me.enemy.squadron[i]; // вся информация о карабле эскадры
                    arrayDescks = warship.matrix; // массив с координатами палуб корабля

                    for (var j = 0; j < arrayDescks.length; j++) {
                        // если координаты одной из палуб корабля совпали с координатами выстрела
                        // увеличиванием счётчик попаданий
                        if (arrayDescks[j][0] == me.coords.x && arrayDescks[j][1] == me.coords.y) {
                            warship.hits++;
                            // если кол-во попаданий в корабль становится равным кол-ву палуб
                            // считаем этот корабль уничтоженным и удаляем его из эскадры
                            if (warship.hits == warship.decks) {
                                me.enemy.squadron.splice(i, 1);
                            } else {
                                var text = (me.player === me.user) ? 'Поздравляем! Вы попали. Ваш выстрел.' : 'Компьютер попал в ваш корабль. Выстрел компьютера';
                                me.showServiseText(text);
                            }
                            break;
                        }
                    }
                }

                // игра закончена, все корбали эскадры противника уничтожены
                if (me.enemy.squadron.length == 0) {
                    var text = (me.player === me.user) ? 'Поздравляем! Вы выиграли.' : 'К сожалению, вы проиграли.';
                    text += ' Хотите продолжить игру?';
                    me.showServiseText(text);
                    // выводим кнопки да / нет
                    // ......

                    if (me.player == me.user) {
                        // снимаем обработчики событий для пользователя
                        me.comp.element.removeEventListener('click', me.shoot);
                        me.comp.element.removeEventListener('contextmenu', me.setEmptyCell);
                    } else {
                        //если выиграл комп., показываем оставшиеся корабли компьютера
                        for (var i = 0; i < me.comp.squadron.length; i++) {
                            var div = document.createElement('div'),
                                dir = (me.comp.squadron[i].kx == 1) ? ' vertical' : '',
                                classname = me.comp.squadron[i].name.slice(0, -1);

                            div.className = 'ship ' + classname + dir;
                            div.style.cssText = 'left:' + (me.comp.squadron[i].y0 * me.comp.shipSize) + 'px; top:' + (me.comp.squadron[i].x0 * me.comp.shipSize) + 'px;';
                            me.comp.element.appendChild(div);
                        }
                    }
                // бой продолжается
                } else {
                    if (me.player === me.comp) {
                        // отмечаем клетки, где точно не может стоять корабль
                        me.markUnnecessaryCell();
                        // обстрел клеток вокруг попадания
                        me.getNeedCoordinatesShot();  
                        // производим новый выстрел
                        setTimeout(function() {
                            me.shoot();
                        }, 1000);
                    }
                }
                break;
            // обстрелянная координата
            case 3:
            case 4:
                if (me.player == me.user) {
                    var text = 'По этим координатам уже стреляли';
                    me.showServiseText(text);
                }
                break;
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

    setEmptyCell (e) {
        if (e.which != 3) return false;
        e.preventDefault();
        var coords = this.transformCoordinates(e, this.comp);

        // прежде чем штриховать клетку, необходимо проверить пустая ли клетка
        // если там уже есть закрашивание, то удалить его, если подбитая палуба или промах,
        // то return
        var ch = this.checkFieldCell(coords, 3);
        if (ch) this.showIcons(this.enemy, coords, 'shaded-cell');
    }

    transformCoordinates (e, instance) {
        var obj = {};
        obj.x = Math.trunc((e.pageY - instance.elementX) / instance.shipSize),
        obj.y = Math.trunc((e.pageX - instance.elementY) / instance.shipSize);
        return obj;
    }

    checkFieldCell (coords) {
        var me = this,
            icons   = this.enemy.element.querySelectorAll('.icon-field'),
            flag    = true,
            isShadedCell;

        [].forEach.call(icons, function(el) {
            var x = el.style.top.slice(0, -2) / me.comp.shipSize,
                y = el.style.left.slice(0, -2) / me.comp.shipSize;

            if (coords.x == x && coords.y == y) {
                isShadedCell = el.classList.contains('shaded-cell');
                if (isShadedCell) el.parentNode.removeChild(el);
                flag = false;
            }
        });
        return flag;
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

    createShootMatrix (values) {
        var type = values[0],
            min = values[1],
            max = values[2];

        switch(type) {
            case 1:
                for (var i = min; i < max; i++) {
                    for(var j = min; j < max; j++) {
                        this.comp.shootMatrix.push([i, j]);
                    }
                }
                break;
            case 2:
                for (var i = min; i < max; i++) {
                    this.comp.orderedShootMatrix.push([i, i]);
                }
                break;
            case 3:
                for (var i = min; i < max; i++) {
                    this.comp.orderedShootMatrix.push([max - i - 1, i]);
                }
                break;
        };

        function compareRandom(a, b) {
            return Math.random() - 0.5;
        }
    }

    deleteElementMatrix (array, obj) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i][0] == obj.x && array[i][1] == obj.y) {
                var el = array.splice(i, 1);
            }
        }
    }
};