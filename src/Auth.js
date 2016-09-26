var Cookies = require('cookies-js');

var Auth = {
    api: 'https://account.uspace.id',
    clientID: '',
    clientSecret: '',
    ttl: 1209600,
    withCredentials: true,
    initCallback:null,
    hasChangeRequest: false,
    init: function(options, callback)
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
        if (callback) {
            this.initCallback = callback;
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
            this.refreshToken(function(res){
                callback(res);
            })
            return;
        }
    },

    hasChange: function(){
        var href = window.location.href;
        var field = 'code';
        var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
        var string = reg.exec(href);
        var code = string ? string[1] : null;
        if (null !== code && false === this.hasChangeRequest) {
            this.hasChangeRequest = true;
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
                console.log(res);
                Cookies.set('token', JSON.stringify(res), {
                    expires: vm.ttl,
                    path: window.location.pathname
                });
                window.removeEventListener('hashchange', vm.hasChange);
                vm.initCallback(res);
            };
        }
    },

    string: function(str) {
      return str == null ? '' : String(str)
    },

    request: function(api, callback){
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
            this.requestAction(api, function(res){
                if (callback) {
                    callback(res);
                }
            });
        }
    },
    requestAction: function(api, callback){
        var request = new XMLHttpRequest;
        var tokenData = JSON.parse(Cookies.get('token'));
        var params = '?access_token='+tokenData['access_token'];
        request.open('GET', this.api+'/api/'+api+params, true);
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
            console.log(tokenData);
            var params = 'grant_type=refresh_token&refresh_token='+tokenData['refresh_token'];
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
