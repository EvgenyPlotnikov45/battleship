'use strict';

import Configurator from 'configurator';
import BattleController from 'battlecontroller';
import Field from 'field';
import Computer from 'computer';
import User from 'user';

export default class Game {

    constructor () {
        this.players = [];
        this.numberUser = null;
        this.numberComputer = null;
    }

    /**
     * Генерация базовой разметки игры
     */
    generateBasicMarkup() {
        let tpl = require('./templates/main.tpl');
        let templater = require('lodash.template');
        let compile = templater(tpl);
        document.body.insertAdjacentHTML('afterBegin', compile());
    }

    /**
     * Валидация входных данных о количестве игроков и компьютеров.
     * Если валидация проходит успешно, то данные записываются.
     */
    saveNumberPlayers () {
        if (this.userNumber && this.computerNumber) return true;

        let userNumber = document.getElementById('userNumber').value;
        let computerNumber = document.getElementById('computerNumber').value;
        if (!(userNumber >= 0 && userNumber <= 3) || !(computerNumber >= 0 && computerNumber <= 3)) {
            let text = 'Укажите количество игроков и компьютеров от 0 до 3'
            document.getElementById('text_btm').innerHTML = text;
            return false;
        }

        this.userNumber = userNumber;
        this.computerNumber = computerNumber;
        document.getElementById('playersNumber').remove();
        document.getElementById('text_btm').innerHTML = '';
        return true;
    }

    /**
     * Запускаем игру. Подписавшись на событие click кнопки play
     * сначала конфигурируем всех пользователей, а после вызываем
     * метод начала боя.
     */
    startGame () {
        let btnPlay = document.getElementById('play');
        let confPlayersNumber = 0;
        btnPlay.addEventListener('click', () => {
            if (!this.saveNumberPlayers()) return;
            btnPlay.setAttribute('data-hidden', true);
            if (confPlayersNumber < this.userNumber) {
                let user = this.createPlayer('user');
                user.show();
                document.getElementById('text_btm').innerHTML = `Конфигурация игрока ${user.fullName}`;
                let configurator = new Configurator(user);
                configurator.generateConfiguratorMarkup();
                configurator.startConfigure();
            } else {
                this.startBattle();
            }
            confPlayersNumber++;
        });
    }

    /**
     * Метод создает компьютеров, инициализирует контроллер боя и запускает бой
     */
    startBattle () {
        // показываем поле компьютера, создаём объект поля компьютера и расставляем корабли
        for (let i = 0; i < this.computerNumber; i++) {
            let computer = this.createPlayer('computer');
            computer.randomLocationShips();
        }

        for (let player of this.players) {
            player.show();
            player.hideShips();
        }

        // Запуск модуля игры
        document.getElementById('play').setAttribute('data-hidden', true);
        var controller = new BattleController(this.players);
        controller.startBattle();
    }

    /**
     * Метод создания игрока.
     * По переданному типу создает либо пользователя, либо компьютера.
     * @param  {String}
     * @return {Field}
     */
    createPlayer (type) {
        let id = this.players.length + 1;
        let element = this.getPlayerElement({
            playerId: 'player' + id
        });
        let player;
        switch (type) {
            case 'computer':
                player = new Computer(element);
                break;
            case 'user':
                player = new User(element);
                break;
            default:
                player = new Field(element);
        }
        player.index = id;
        element.querySelector('.fieldName').innerHTML = player.fullName;
        this.players.push(player);
        document.getElementById('main').appendChild(element);
        return player;
    }

    getPlayerElement (tplData) {
        let tpl = require('./templates/player.tpl');
        let templater = require('lodash.template');
        let compile = templater(tpl);
        let element = document.createElement('div');
        element.innerHTML = compile(tplData);
        element = element.firstElementChild;
        return element;
    }
};