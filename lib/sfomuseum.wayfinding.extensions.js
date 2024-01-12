// https://gist.github.com/evdokimovm/0e7163faf7c8fe24e41e6b68461e4feb

// Convert from degrees to radians.
Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
}
Math.radians(90); // 1.5707963267948966

// Convert from radians to degrees.
Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
}
Math.degrees(3.141592653589793); // 180

// https://gregorthemapguy.blogspot.com/2014/02/leaflet-latlng-objects-get-bearings.html
L.LatLng.prototype.bearingTo = function(other) {

    // Removed in Leaflet 1.x
    // var d2r  = L.LatLng.DEG_TO_RAD;
    // var r2d  = L.LatLng.RAD_TO_DEG;

    var lat1 = Math.radians(this.lat);	// this.lat * d2r;
    var lat2 = Math.radians(other.lat);	// other.lat * d2r;

    var dLon = Math.radians(other.lng-this.lng);	 //(other.lng-this.lng) * d2r;
    var y    = Math.sin(dLon) * Math.cos(lat2);
    var x    = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x);

    brng = parseInt(Math.degrees(brng));	// parseInt( brng * r2d );
    brng = (brng + 360) % 360;
    return brng;
};

L.LatLng.prototype.bearingWordTo = function(other) {
    var bearing = this.bearingTo(other);
    var bearingword = '';
    if      (bearing >=  22 && bearing <=  67) bearingword = 'go straight';	// 'NE';
    else if (bearing >=  67 && bearing <= 112) bearingword = 'turn right';	// 'E';
    else if (bearing >= 112 && bearing <= 157) bearingword = 'turn left';	// 'turn around and head left';	// 'SE';
    else if (bearing >= 157 && bearing <= 202) bearingword = 'turn around';	//  'S';
    else if (bearing >= 202 && bearing <= 247) bearingword = 'turn right';	// 'turn around and keep to the right';	//'SW';
    else if (bearing >= 247 && bearing <= 292) bearingword = 'turn left';				// 'W';
    else if (bearing >= 292 && bearing <= 337) bearingword = 'head left';				// 'NW';
    else if (bearing >= 337 || bearing <=  22) bearingword = 'go straight';				//  'N';
    return bearingword;
};
