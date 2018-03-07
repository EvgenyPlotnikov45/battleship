'use strict';

export default class Game {
    generateBasicMarkup() {
        document.body.insertAdjacentHTML('afterBegin', '' +
        '<div class="wrapper">' +
            '<div id="text_top" class="text-top">BattleShip</div>' +
            '<div class="main clearfix">' +
            '</div>' +
            '<span id="play" class="btn-play">Играть</span>' +
            '<div id="text_btm" class="text-btm"></div>' +
        '</div>');
    }
};