'use strict';

import Utils from 'utils';
import Field from 'field';

export default class User extends Field {
    constructor () {
        super(...arguments);
        this.name = 'Пользователь';
    }
}