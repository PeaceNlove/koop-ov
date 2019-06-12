/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: https://koopjs.github.io/docs/usage/provider
*/
var proj4 = require('proj4');
var request = require('request');
function Model (koop) {}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Model.prototype.getData = function (req, callback) {
  const url = "http://www.ovradar.nl/api6/posinfo";
  proj4.defs('EPSG:28992','+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs');
  const geojson = {
    type: 'FeatureCollection',
    features: [],
    metadata: {
    name: "OV", // The name of the layer
    description: "This layer contains the public transport vehicle positions", // The description of the layer
    displayField: "headsign", // The display field to be used by a client
    idField: "OBJECTID"
    },
    ttl: 60
  }
    console.log(url);
    request.get(url, function(e, res){
        var text = res.body;
        var j=0;
        var lines = text.split("\n");
          for (var i in lines){
          j=j+1;
          var vehicle = lines[i].split(";");
          var key = vehicle[0].split("|");
          var headsign = vehicle[1] != null ? vehicle[1]:"";
          var punctualiteit = vehicle[8];
          var pmin = 0;
          var psec = 0;
          var puncraw = punctualiteit;
            if (punctualiteit == '' || !punctualiteit){
                punctualiteit = "Niet beschikbaar"
            }else if (punctualiteit > 0){
                punc = punctualiteit
                pmin = Math.floor(punc / 60);
                psec = punc % 60;
                //psec = (String(punc % 60)).lpad('0',2);
                punctualiteit = "+" + pmin+':'+psec + " minuut";
            }else if (punctualiteit <= 0) {
                punc = punctualiteit
                pmin = Math.floor(punc / 60);
                psec = (punc % 60) * -1;
                //psec = (String(punc % 60 * -1)).lpad('0',2);
                punctualiteit = pmin+':'+psec + " minuut";
            }
          var rit = key[2];
          var fullheadsign = key[1];
          var vervoerder = key[0];
          var voertuignummer = ovradar_voertuignummer(vehicle);
          var status = vehicle[5];
          var distance = vehicle[7];
          var id = vehicle[0];
          var update = vehicle[10];
          var snelheid = vehicle[9];
          //proj4(fromProjection[, toProjection, coordinates])
          var x = parseFloat(vehicle[4]);
          var y = parseFloat(vehicle[3]);
          
          if (x!= null && y != null && x!=0 && y!=0  && !isNaN(x) && !isNaN(y)){
              var wgscoord = proj4('EPSG:28992', 'EPSG:4326', [x,y]);
            
                var feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": wgscoord
                },
                "properties": {
                    "OBJECTID": j,
                    "id": id,
                    "key": key,
                    "vervoerder": vervoerder,
                    "headsign": headsign,
                    "status": status,
                    "distance": distance!= null && distance!= ""? parseFloat(distance): null,
                    "punctualiteit": punctualiteit,
                    "pmin": pmin,
                    "psec": psec,
                    "puncraw":puncraw,
                    "rit": rit,
                    "voertuignummer": voertuignummer,
                    "snelheid": snelheid!= null && snelheid!= ""? parseFloat(snelheid): null,
                    "fullheadsign": fullheadsign,
                    "lastupdate": new Date(parseInt(update)*1000).toISOString().replace("T","-").replace("Z","")
                }
              }
              geojson.features.push(feature);
            }
            else{
                console.log("empty bus position")
            }
          }
          callback(null, geojson);
      });
    }

  
function ovradar_voertuignummer(vehicle){
   dataownercode = vehicle[0].split('|')[0];
   linenumber = vehicle[0].split('|')[1];
   if (dataownercode == 'QBUZZ' && (linenumber === 'u060' || linenumber == 'u061' || linenumber ==  'u260')){
       var voertuignummer = parseInt(vehicle[2]);
       if (voertuignummer >= 10000){
           var secondVehicle = voertuignummer%100;
           var firstVehicle =  ((voertuignummer-secondVehicle)/100)%100;
           return (5000+firstVehicle)+' + '+(5000+secondVehicle);
       }
   }
   return vehicle[2];
}
 


module.exports = Model
