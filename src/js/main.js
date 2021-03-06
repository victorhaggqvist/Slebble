/* eslint strict: 0 */

var Slebble = require('./slebble.js');

Pebble.addEventListener('ready', () => {
    console.log('ready');
    var response = localStorage.data;
    if (response !== '' && typeof response === 'string') {
        console.log('has data');
        response = JSON.parse(localStorage.data);
        console.log('saved data'+JSON.stringify(response));
        Slebble.loadConfig(response);
        var stations = [];
        for (var i = 0; i < response.route.length; i++) {
            let ad = {};
            ad.from = response.route[i].from.replace(/\053/g, ' ');
            stations.push(ad);
        }
        Slebble.addStation(stations, 0);
    } else {
        let ad = {};
        ad.from = 'No configuration';
        ad = [ad];
        Slebble.addStation(ad, 0);
    }
});


Pebble.addEventListener('showConfiguration', () => {
    if (localStorage.data) {
        Pebble.openURL('http://diesel-ability-711.appspot.com/webconfig/index.html?version=2.0' + '&setting=' + localStorage.data);
    } else {
        Pebble.openURL('http://diesel-ability-711.appspot.com/webconfig/index.html?version=2.0');
    }
});

Pebble.addEventListener('webviewclosed', (e) => {
    if (e.response === 'reset') {
        localStorage.removeItem('data');
    } else if (e.response !== 'CANCELLED' && e.response.substring(0, 12) !== '{"route": []' && e.response !== '{}') {
        localStorage.setItem('data', e.response);

        if (localStorage.data) {
            var response = JSON.parse(localStorage.data);
            Slebble.loadConfig(response);

            var stations = [];
            for (var i = 0; i < response.route.length; i++) {
                var ad = {};
                ad.from = response.route[i].from.replace(/\053/g, ' ');
                stations.push(ad);
            }

            Slebble.addStation(stations, 0);

        }
    }
});

Pebble.addEventListener('appmessage', (e) => {
    /**
    * payload[1] : menu row
    * payload[2] : step, is saying which instruction the watch excpects
    * payload[3] : expected package key
    */
    if (e.payload[2] === 0) {
        if (e.payload[1] !== 0) {
            Slebble.requestRides(e.payload[1] - 1, e.payload[2], e.payload[3]);
        } else {
            Slebble.requestGeoRides(e.payload[3]);
        }
    } else if (e.payload[2] === 1){
        Slebble.requestRides(e.payload[1], e.payload[2], e.payload[3]);
    } else {
        Slebble.requestUpdate(e.payload[3]);
    }
});
