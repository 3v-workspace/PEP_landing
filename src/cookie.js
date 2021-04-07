import $ from 'jquery';
import 'jquery.cookie';

const set = (name, value, options = {}) => {
    $.cookie(name, value, {
        path: '/',
        domain: process.env.COOKIE_DOMAIN,
        expires: 7,
        ...options,
    });
}
const get = (name) => {
    return $.cookie(name)
}

const remove = (name, options = {}) => {
    $.removeCookie(name, {
        path: '/',
        domain: process.env.COOKIE_DOMAIN,
        ...options,
    });
}

export default {
    set,
    get,
    remove,
}
