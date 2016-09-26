(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Cookies.js - 1.2.2
 * https://github.com/ScottHamper/Cookies
 *
 * This is free and unencumbered software released into the public domain.
 */
(function (global, undefined) {
    'use strict';

    var factory = function (window) {
        if (typeof window.document !== 'object') {
            throw new Error('Cookies.js requires a `window` with a `document` object');
        }

        var Cookies = function (key, value, options) {
            return arguments.length === 1 ?
                Cookies.get(key) : Cookies.set(key, value, options);
        };

        // Allows for setter injection in unit tests
        Cookies._document = window.document;

        // Used to ensure cookie keys do not collide with
        // built-in `Object` properties
        Cookies._cacheKeyPrefix = 'cookey.'; // Hurr hurr, :)
        
        Cookies._maxExpireDate = new Date('Fri, 31 Dec 9999 23:59:59 UTC');

        Cookies.defaults = {
            path: '/',
            secure: false
        };

        Cookies.get = function (key) {
            if (Cookies._cachedDocumentCookie !== Cookies._document.cookie) {
                Cookies._renewCache();
            }
            
            var value = Cookies._cache[Cookies._cacheKeyPrefix + key];

            return value === undefined ? undefined : decodeURIComponent(value);
        };

        Cookies.set = function (key, value, options) {
            options = Cookies._getExtendedOptions(options);
            options.expires = Cookies._getExpiresDate(value === undefined ? -1 : options.expires);

            Cookies._document.cookie = Cookies._generateCookieString(key, value, options);

            return Cookies;
        };

        Cookies.expire = function (key, options) {
            return Cookies.set(key, undefined, options);
        };

        Cookies._getExtendedOptions = function (options) {
            return {
                path: options && options.path || Cookies.defaults.path,
                domain: options && options.domain || Cookies.defaults.domain,
                expires: options && options.expires || Cookies.defaults.expires,
                secure: options && options.secure !== undefined ?  options.secure : Cookies.defaults.secure
            };
        };

        Cookies._isValidDate = function (date) {
            return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
        };

        Cookies._getExpiresDate = function (expires, now) {
            now = now || new Date();

            if (typeof expires === 'number') {
                expires = expires === Infinity ?
                    Cookies._maxExpireDate : new Date(now.getTime() + expires * 1000);
            } else if (typeof expires === 'string') {
                expires = new Date(expires);
            }

            if (expires && !Cookies._isValidDate(expires)) {
                throw new Error('`expires` parameter cannot be converted to a valid Date instance');
            }

            return expires;
        };

        Cookies._generateCookieString = function (key, value, options) {
            key = key.replace(/[^#$&+\^`|]/g, encodeURIComponent);
            key = key.replace(/\(/g, '%28').replace(/\)/g, '%29');
            value = (value + '').replace(/[^!#$&-+\--:<-\[\]-~]/g, encodeURIComponent);
            options = options || {};

            var cookieString = key + '=' + value;
            cookieString += options.path ? ';path=' + options.path : '';
            cookieString += options.domain ? ';domain=' + options.domain : '';
            cookieString += options.expires ? ';expires=' + options.expires.toUTCString() : '';
            cookieString += options.secure ? ';secure' : '';

            return cookieString;
        };

        Cookies._getCacheFromString = function (documentCookie) {
            var cookieCache = {};
            var cookiesArray = documentCookie ? documentCookie.split('; ') : [];

            for (var i = 0; i < cookiesArray.length; i++) {
                var cookieKvp = Cookies._getKeyValuePairFromCookieString(cookiesArray[i]);

                if (cookieCache[Cookies._cacheKeyPrefix + cookieKvp.key] === undefined) {
                    cookieCache[Cookies._cacheKeyPrefix + cookieKvp.key] = cookieKvp.value;
                }
            }

            return cookieCache;
        };

        Cookies._getKeyValuePairFromCookieString = function (cookieString) {
            // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
            var separatorIndex = cookieString.indexOf('=');

            // IE omits the "=" when the cookie value is an empty string
            separatorIndex = separatorIndex < 0 ? cookieString.length : separatorIndex;

            var key = cookieString.substr(0, separatorIndex);
            var decodedKey;
            try {
                decodedKey = decodeURIComponent(key);
            } catch (e) {
                if (console && typeof console.error === 'function') {
                    console.error('Could not decode cookie with key "' + key + '"', e);
                }
            }
            
            return {
                key: decodedKey,
                value: cookieString.substr(separatorIndex + 1) // Defer decoding value until accessed
            };
        };

        Cookies._renewCache = function () {
            Cookies._cache = Cookies._getCacheFromString(Cookies._document.cookie);
            Cookies._cachedDocumentCookie = Cookies._document.cookie;
        };

        Cookies._areEnabled = function () {
            var testKey = 'cookies.js';
            var areEnabled = Cookies.set(testKey, 1).get(testKey) === '1';
            Cookies.expire(testKey);
            return areEnabled;
        };

        Cookies.enabled = Cookies._areEnabled();

        return Cookies;
    };

    var cookiesExport = typeof global.document === 'object' ? factory(global) : factory;

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function () { return cookiesExport; });
    // CommonJS/Node.js support
    } else if (typeof exports === 'object') {
        // Support Node.js specific `module.exports` (which can be a function)
        if (typeof module === 'object' && typeof module.exports === 'object') {
            exports = module.exports = cookiesExport;
        }
        // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
        exports.Cookies = cookiesExport;
    } else {
        global.Cookies = cookiesExport;
    }
})(typeof window === 'undefined' ? this : window);
},{}],2:[function(require,module,exports){
var Cookies = require('cookies-js');

var Auth = {
    api: 'https://account.uspace.id',
    clientID: '',
    clientSecret: '',
    ttl: 1209600,
    withCredentials: true,
    init: function(options)
    {
        if (typeof options.api !== 'undefined') {
            this.api = options.api;
        }
        if (typeof options.clientID !== 'undefined') {
            this.clientID = options.clientID;
        }
        if (typeof options.withCredentials !== 'undefined') {
            this.withCredentials = options.withCredentials;
        }
        if (typeof options.clientSecret !== 'undefined') {
            this.clientSecret = options.clientSecret;
        }

        var token = Cookies.get('token');

        // Check apakah cookie token sudah ada
        if (typeof token === 'undefined' || token === '') {
            // Detect hash change untuk mengambil code dari callback Oauth
            window.addEventListener('hashchange', this.hasChange.bind(this), false);
            // Open Popup window
            window.open(this.api+'/authorize?response_type=code&client_id=57tkh69u0&state=xyz&hash=login', 'Authorize', 'height=600,width=400');
        } else {
            // Delete event
            window.removeEventListener('hashchange', this.hasChange);
            return;
        }
    },

    hasChange: function(){
        var href = window.location.href;
        var field = 'code';
        var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
        var string = reg.exec(href);
        var code = string ? string[1] : null;
        if (null !== code) {
            var request = new XMLHttpRequest;
            var params = 'grant_type=authorization_code&code='+code;
            request.open('POST', this.api+'/api/token', true);

            request.setRequestHeader("Accept", "application/json, application/x-www-form-urlencoded");
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            if (this.withCredentials === true) {
                request.withCredentials = true;
                request.setRequestHeader("Authorization", "Basic " + btoa(this.string(this.clientID) + ':' + this.string(this.clientSecret)));
            } else {
                params += '&client_id='+this.clientID+'&client_secret='+this.clientSecret;
            }

            request.send(params);
            var vm = this;
            request.onload = function(){
                var res = JSON.parse(this.responseText);
                var now = new Date();
                res['token_expired'] = new Date(now.getTime() + res['expires_in'] * 1000);
                Cookies.set('token', JSON.stringify(res), {
                    expires: vm.ttl,
                    path: window.location.pathname
                });
                window.removeEventListener('hashchange', vm.hasChange);
            };
        }
        return;
    },

    string: function(str) {
      return str == null ? '' : String(str)
    },

    getAccount: function(callback){
        var token = Cookies.get('token');
        if (typeof token ===  'undefined' || token === '') {
            return false;
        }

        var tokenData = JSON.parse(token);
        var expired = new Date(tokenData['token_expired']);
        var now = new Date();
        if (now.getTime() > (expired.getTime()) - 5000) {
            var vm = this;
            this.refreshToken(function(){
                vm.getAccountRequest(function(res){
                    if (callback) {
                        callback(res);
                    }
                });
            });
        } else {
            vm.getAccountRequest(function(res){
                if (callback) {
                    callback(res);
                }
            });
        }
    },

    getAccountRequest: function(callback){
        var request = new XMLHttpRequest;
        var params = '?access_token='+Cookies.get('token');
        request.open('GET', this.api+'/api/account'+params, true);
        request.send();
        request.onload = function(){
            var res = JSON.parse(this.responseText);
            if (callback) {
                callback(res);
            }
        };
    },

    refreshToken: function(callback){
        var token = Cookies.get('token');
        if (typeof token !== 'undefined') {
            var tokenData = JSON.parse(token);
            var request = new XMLHttpRequest;
            var params = 'grant_type=refresh_token&refresh_token='+token['refresh_token'];
            request.open('POST', this.api+'/api/token', true);

            request.setRequestHeader("Accept", "application/json, application/x-www-form-urlencoded");
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            if (this.withCredentials === true) {
                request.withCredentials = true;
                request.setRequestHeader("Authorization", "Basic " + btoa(this.string(this.clientID) + ':' + this.string(this.clientSecret)));
            } else {
                params += '&client_id='+this.clientID+'&client_secret='+this.clientSecret;
            }

            request.send(params);
            var vm = this;
            request.onload = function(){
                var res = JSON.parse(this.responseText);
                var now = new Date();
                res['token_expired'] = new Date(now.getTime() + res['expires_in'] * 1000);
                Cookies.set('token', JSON.stringify(res), {
                    expires: vm.ttl,
                    path: window.location.pathname
                });
                if (callback) {
                    callback(res);
                }
            };
        }
    }
}

module.exports = Auth;

},{"cookies-js":1}]},{},[2]);
