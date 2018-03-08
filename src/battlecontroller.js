'use strict';

export default class BattleController {
    constructor () {
        var me = this;
        var rnd = getRandom(1);
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

    
};