'use strict';

import Utils from 'utils';

export default class BattleController {
    constructor () {
        var me = this;
        var rnd = Utils.getRandom(1);
        player = (rnd == 0) ? user : comp;
        enemy = (player === user) ? comp : user;
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
        if (player === user) {
            // устанавливаем обработчики событий для пользователя
            compfield.addEventListener('click', me.shoot);
            compfield.addEventListener('contextmenu', me.setEmptyCell);
            me.showServiseText('Вы стреляете первым.');
        } else {
            me.showServiseText('Первым стреляет компьютер.');
            setTimeout(function() {
                return me.shoot();
            }, 1000);
        }
    }

    shoot (e) {
        // e !== undefined - значит выстрел производит игрок
        // координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
        if (e !== undefined) {
            if (e.which != 1) return false;
            // получаем координаты выстрела
            coords = self.transformCoordinates(e, enemy);
        } else {
            // генерируются матричные координаты выстрела компьютера
            if (comp.needShootMatrix.length) {
                self.needShoot();
            } else {
                self.getCoordinatesShot();
            }
        }

        var val = enemy.matrix[coords.x][coords.y];

        // проверяем какая иконка есть в клетке с данными координатами,
        // если заштрихованная иконка, то удаляем её
        self.checkFieldCell(coords);

        switch(val) {
            // промах
            case 0:
                // устанавливаем иконку промаха и записываем промах в матрицу
                self.showIcons(enemy, coords, 'dot');
                enemy.matrix[coords.x][coords.y] = 3;

                text = (player === user) ? 'Вы промахнулись. Стреляет компьютер.' : 'Компьютер промахнулся. Ваш выстрел.';
                self.showServiseText(text);

                // определяем, чей выстрел следующий
                player = (player === user) ? comp : user;
                enemy = (player === user) ? comp : user;

                if (player == comp) {
                    // снимаем обработчики событий для пользователя
                    compfield.removeEventListener('click', self.shoot);
                    compfield.removeEventListener('contextmenu', self.setEmptyCell);
                    setTimeout(function() {
                        return self.shoot();
                    }, 1000);
                } else {
                    // устанавливаем обработчики событий для пользователя
                    compfield.addEventListener('click', self.shoot);
                    compfield.addEventListener('contextmenu', self.setEmptyCell);
                }
                break;

            // попадание
            case 1:
                enemy.matrix[coords.x][coords.y] = 4;
                self.showIcons(enemy, coords, 'red-cross');

                // вносим изменения в массив эскадры
                // необходимо найти корабль, в который попали
                var warship, arrayDescks;
                for (var i = enemy.squadron.length - 1; i >= 0; i--) {
                    warship     = enemy.squadron[i]; // вся информация о карабле эскадры
                    arrayDescks = warship.matrix; // массив с координатами палуб корабля

                    for (var j = 0, length = arrayDescks.length; j < length; j++) {
                        // если координаты одной из палуб корабля совпали с координатами выстрела
                        // увеличиванием счётчик попаданий
                        if (arrayDescks[j][0] == coords.x && arrayDescks[j][1] == coords.y) {
                            warship.hits++;
                            // если кол-во попаданий в корабль становится равным кол-ву палуб
                            // считаем этот корабль уничтоженным и удаляем его из эскадры
                            if (warship.hits == warship.decks) {
                                enemy.squadron.splice(i, 1);
                            } else {
                                text = (player === user) ? 'Поздравляем! Вы попали. Ваш выстрел.' : 'Компьютер попал в ваш корабль. Выстрел компьютера';
                                self.showServiseText(text);
                            }
                            break;
                        }
                    }
                }

                // игра закончена, все корбали эскадры противника уничтожены
                if (enemy.squadron.length == 0) {
                    text = (player === user) ? 'Поздравляем! Вы выиграли.' : 'К сожалению, вы проиграли.';
                    text += ' Хотите продолжить игру?';
                    srvText.innerHTML = text;
                    // выводим кнопки да / нет
                    // ......

                    if (player == user) {
                        // снимаем обработчики событий для пользователя
                        compfield.removeEventListener('click', self.shoot);
                        compfield.removeEventListener('contextmenu', self.setEmptyCell);
                    } else {
                        //если выиграл комп., показываем оставшиеся корабли компьютера
                        for (var i = 0, length = comp.squadron.length; i < length; i++) {
                            var div         = document.createElement('div'),
                                dir         = (comp.squadron[i].kx == 1) ? ' vertical' : '',
                                classname   = comp.squadron[i].shipname.slice(0, -1);

                            div.className = 'ship ' + classname + dir;
                            div.style.cssText = 'left:' + (comp.squadron[i].y0 * comp.shipSide) + 'px; top:' + (comp.squadron[i].x0 * comp.shipSide) + 'px;';
                            comp.field.appendChild(div);
                        }
                    }
                // бой продолжается
                } else {
                    if (player === comp) {
                        // отмечаем клетки, где точно не может стоять корабль
                        self.markUnnecessaryCell();
                        // обстрел клеток вокруг попадания
                        self.getNeedCoordinatesShot();  
                        // производим новый выстрел
                        setTimeout(function() {
                            return self.shoot();
                        }, 1000);
                    }
                }
                break;
            // обстрелянная координата
            case 3:
            case 4:
                if (player == user) {
                    text = 'По этим координатам уже стреляли';
                    self.showServiseText(text);
                }
                break;
        }
    }

    getCoordinatesShot () {
        var rnd, val;
        if (comp.orderedShootMatrix.length != 0) {
            if (comp.orderedShootMatrix.length > 10) {
                rnd = getRandom(9);
            } else {
                rnd = getRandom(comp.orderedShootMatrix.length - 1);
            }
            val = comp.orderedShootMatrix.splice(rnd, 1)[0];
        } else {
            rnd = getRandom(comp.shootMatrix.length - 1),
            val = comp.shootMatrix.splice(rnd, 1)[0];
        }

        coords = {
            x: val[0],
            y: val[1]
        };

        self.deleteElementMatrix(comp.shootMatrix, coords);
    }

    getNeedCoordinatesShot () {
        var kx = 0, ky = 0;
        if (Object.keys(comp.firstHit).length === 0) {
            comp.firstHit = coords;
        } else {
            comp.lastHit = coords;
            kx = (Math.abs(comp.firstHit.x - comp.lastHit.x) == 1) ? 1 : 0;
            ky = (Math.abs(comp.firstHit.y - comp.lastHit.y) == 1) ? 1 : 0;
            comp.firstHit = comp.lastHit;
            comp.lastHit = {};
        }

        if (coords.x > 0 && ky == 0) comp.needShootMatrix.push([coords.x - 1, coords.y]);
        if (coords.x < 9 && ky == 0) comp.needShootMatrix.push([coords.x + 1, coords.y]);
        if (coords.y > 0 && kx == 0) comp.needShootMatrix.push([coords.x, coords.y - 1]);
        if (coords.y < 9 && kx == 0) comp.needShootMatrix.push([coords.x, coords.y + 1]);

        for (var i = comp.needShootMatrix.length - 1; i >= 0; i--) {
            var x = comp.needShootMatrix[i][0],
                y = comp.needShootMatrix[i][1];
            //удаляем точки, по которым уже проводился обстрел или стрельба не имеет смысла
            if (user.matrix[x][y] != 0 && user.matrix[x][y] != 1) {
                comp.needShootMatrix.splice(i,1);
                self.deleteElementMatrix(comp.shootMatrix, coords);
                if (comp.orderedShootMatrix.length != 0) {
                    self.deleteElementMatrix(comp.orderedShootMatrix, coords);
                }
            }
        }
        return;
    }

    needShoot () {
        var val = comp.needShootMatrix.shift();
        coords = {
            x: val[0],
            y: val[1]
        }
        // удаляем координаты по которым произошел выстрел
        self.deleteElementMatrix(comp.shootMatrix, coords);
        if (comp.orderedShootMatrix.length != 0) {
            self.deleteElementMatrix(comp.orderedShootMatrix, coords);
        }
    }

    markUnnecessaryCell () {
        var icons   = user.field.querySelectorAll('.icon-field'),
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
                var x = icons[j].style.top.slice(0, -2) / user.shipSide,
                    y = icons[j].style.left.slice(0, -2) / user.shipSide;
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
            self.showIcons(enemy, obj, 'shaded-cell');
            user.matrix[obj.x][obj.y] = 2;

            // удаляем из массивов выстрелов ненужные координаты
            self.deleteElementMatrix(comp.shootMatrix, obj);
            if (comp.needShootMatrix.length != 0) {
                self.deleteElementMatrix(comp.needShootMatrix, obj);
            }
            if (comp.orderedShootMatrix.length != 0) {
                self.deleteElementMatrix(comp.orderedShootMatrix, obj);
            }
        }
    }

    setEmptyCell (e) {
        if (e.which != 3) return false;
        e.preventDefault();
        var coords = self.transformCoordinates(e, comp);

        // прежде чем штриховать клетку, необходимо проверить пустая ли клетка
        // если там уже есть закрашивание, то удалить его, если подбитая палуба или промах,
        // то return
        var ch = self.checkFieldCell(coords, 3);
        if (ch) self.showIcons(enemy, coords, 'shaded-cell');
    }

    transformCoordinates (e, instance) {
        var obj = {};
        obj.x = Math.trunc((e.pageY - instance.fieldX) / instance.shipSide),
        obj.y = Math.trunc((e.pageX - instance.fieldY) / instance.shipSide);
        return obj;
    }

    checkFieldCell (coords) {
        var icons   = enemy.field.querySelectorAll('.icon-field'),
            flag    = true,
            isShadedCell;

        [].forEach.call(icons, function(el) {
            var x = el.style.top.slice(0, -2) / comp.shipSide,
                y = el.style.left.slice(0, -2) / comp.shipSide;

            if (coords.x == x && coords.y == y) {
                isShadedCell = el.classList.contains('shaded-cell');
                if (isShadedCell) el.parentNode.removeChild(el);
                flag = false;
            }
        });
        return flag;
    }

    showIcons (enemy, coords, iconClass) {
        var div = document.createElement('div');
        div.className = 'icon-field ' + iconClass;
        div.style.cssText = 'left:' + (coords.y * enemy.shipSide) + 'px; top:' + (coords.x * enemy.shipSide) + 'px;';
        enemy.field.appendChild(div);
    }

    showServiseText (text) {
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
                        comp.shootMatrix.push([i, j]);
                    }
                }
                break;
            case 2:
                for (var i = min; i < max; i++) {
                    comp.orderedShootMatrix.push([i, i]);
                }
                break;
            case 3:
                for (var i = min; i < max; i++) {
                    comp.orderedShootMatrix.push([max - i - 1, i]);
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