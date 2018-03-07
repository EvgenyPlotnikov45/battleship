'use strict';
import Game from 'Game';
let a = 6;
var b = 5;
class QWE {
	constructor(name){
		this.name = name;
	}
	qwe() {
		console.log(this.name);
	}
}

let qwe = new QWE('QWE');
qwe.qwe();

let promise = new Promise((resolve) => {
	resolve();
});

promise.then(() => {
	console.log('Promise ok')
});

var game = new Game();
game.asd = 'qwe';
console.log(game.asd);

async function testAsync(a) {
	return a;
}

testAsync(5).then((data) => console.log(data));