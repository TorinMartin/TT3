
var API_URL = "https://hrmbuses.herokuapp.com/";
var API_URL_BK = "https://hrmbuses.azurewebsites.net/";
var busses = [];

var map;

var LeafIcon = L.Icon.extend({
    options: {
        iconSize:     [30, 32],
        shadowSize:   [0, 0],
        iconAnchor:   [30, 32],
        popupAnchor:  [-20, -20]
    }
});

var busIcon = new LeafIcon({
    iconUrl: 'bus.png',
    shadowUrl: 'http://leafletjs.com/examples/custom-icons/leaf-shadow.png'
});

(function(){

    //create map in leaflet and tie it to the div called 'theMap'
    map = L.map('theMap').setView([44.650627, -63.597140], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
})()

function FormatBusInformation(bus){
    var busId = bus.id;
    var routeId = bus.vehicle.trip.routeId;
    var poslat = bus.vehicle.position.latitude;
    var poslon = bus.vehicle.position.longitude;
    var velocity = bus.vehicle.position.speed;
    var time = bus.vehicle.timestamp;
    var direction = bus.vehicle.position.bearing;

    if (typeof velocity === 'undefined') {
        velocity = 0;
    }

    var date = new Date(time * 1000);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();

    var formattedTime = `${year}-${month}-${day} ${hours}:${minutes.substr(-2)}`;

    var info = 
    `
    <ul>
        <li><strong>ID: </strong> ${busId}</li>
        <li><strong>Route: </strong> ${routeId}</li>
        <li><strong>Latitude: </strong> ${poslat}</li>
        <li><strong>Longitude: </strong> ${poslon}</li>
        <li><strong>Velocity: </strong> ${velocity.toFixed()}</li>
        <li><strong>Time: </strong> ${formattedTime}</li>
        <li><strong>Direction: </strong> ${direction}</li>
    </ul>
    `;

    return info;
}

function CreateMarkers(){
    busses.forEach(function(bus) {
        var geojsonFeature = {
            "type": "Feature",
            "properties": {
                "id": bus.id,
                "route": bus.vehicle.trip.routeId,
                "popupContent": FormatBusInformation(bus)
            },
            "geometry": {
                "type": "Point",
                "coordinates": [bus.vehicle.position.longitude, bus.vehicle.position.latitude]
            }
        };
           
        L.geoJSON(geojsonFeature, {
            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.popupContent);
              },
            pointToLayer: (feature, latlng) => {
              return L.marker(latlng, { rotationAngle: bus.vehicle.position.bearing, icon: busIcon});
            }
          }).addTo(layerGroup);
    });
}

function IterateData(busJson){
    busJson.forEach(function(bus) {
        if(bus.vehicle.trip.routeId <= 10){
            busses.push(bus);
        }
      });
    CreateMarkers();
}

function FetchData(){
    fetch(API_URL)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        IterateData(json.entity);
      });
}

FetchData();

var layerGroup = L.layerGroup().addTo(map);

const interval = setInterval(function() {
    busses = [];
    layerGroup.clearLayers();
    FetchData();
  }, 7000);
