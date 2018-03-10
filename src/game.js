'use strict';

import Configurator from 'configurator';
import BattleController from 'battlecontroller';
import Field from 'field';
import Computer from 'computer';
import User from 'user';

export default class Game {

    constructor () {
        this.players = [];
    }

    generateBasicMarkup() {
        document.body.insertAdjacentHTML('afterBegin', '' +
        '<div class="wrapper">' +
            '<div id="text_top" class="text-top">BattleShip</div>' +
            '<div id="main" class="main clearfix">' +
            '</div>' +
            '<span id="play" class="btn-play">Играть</span>' +
            '<div id="text_btm" class="text-btm"></div>' +
        '</div>');
    }

    startGame() {
        var me = this;
        var btnPlay = document.getElementById('play');
        var index = 0;
        btnPlay.addEventListener('click', function () {
            btnPlay.setAttribute('data-hidden', true);
            if (index === 0) {
                var player = me.createPlayer('user');
                player.show();
                var configurator = new Configurator();
                configurator.generateConfiguratorMarkup();
                configurator.startConfigure(player);
            } else {
                me.startBattle();
            }
            index++;
        });
    }

    startBattle () {
        document.getElementById('instruction').remove();
        // показываем поле компьютера, создаём объект поля компьютера и расставляем корабли
        var computer = this.createPlayer('computer');
        computer.randomLocationShips();
        computer.show();
        var computer2 = this.createPlayer('computer');
        computer2.randomLocationShips();
        computer2.show();
        document.getElementById('play').setAttribute('data-hidden', true);

        // удаляем события с поля игрока (отмена редактирования расстановки кораблей)
        // userfield.removeEventListener('mousedown', user.onMouseDown);
        // userfield.addEventListener('contextmenu', function(e) {
        //     e.preventDefault();
        //     e.stopPropagation();
        //     return false;
        // });

        // Запуск модуля игры
        var controller = new BattleController(this.players);
        controller.startBattle();
    }

    createPlayer (type) {
        var id = this.players.length + 1;
        var fieldElement = document.createElement('div');
        fieldElement.classList.add('field');
        fieldElement.setAttribute('data-hidden', true);
        var shipsElement = document.createElement('div');
        shipsElement.classList.add('ships');
        shipsElement.setAttribute('id', 'player' + id);
        fieldElement.appendChild(shipsElement);
        var field;
        switch (type) {
            case 'computer':
                field = new Computer(fieldElement);
                break;
            case 'user':
                field = new User(fieldElement);
                break;
            default:
                field = new Field(fieldElement);
        }
        field.index = id;
        this.players.push(field);
        document.getElementById('main').appendChild(fieldElement);
        return field;
    }
};