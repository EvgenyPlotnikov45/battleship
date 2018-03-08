'use strict';

import Configurator from 'configurator';

export default class Game {
    generateBasicMarkup() {
        document.body.insertAdjacentHTML('afterBegin', '' +
        '<div class="wrapper">' +
            '<div id="text_top" class="text-top">BattleShip</div>' +
            '<span id="play" class="btn-play">Играть</span>' +
            '<div id="main" class="main clearfix">' +
            '</div>' +
            '<div id="text_btm" class="text-btm"></div>' +
        '</div>');
    }

    startGame() {
        var btnPlay = document.getElementById('play');
        btnPlay.addEventListener('click', function () {
            btnPlay.setAttribute('data-hidden', true);
            var configurator = new Configurator();
            configurator.generateConfiguratorMarkup();
            configurator.startConfigure();
        });
    }
};