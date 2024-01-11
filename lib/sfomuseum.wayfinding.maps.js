var sfomuseum = sfomuseum || {};
sfomuseum.wayfinding = sfomuseum.wayfinding || {};

sfomuseum.wayfinding.maps = (function(){

    var maps = {};
    var panes = {};

    var self = {

	removeMap: function(map_id){

	    if (maps[map_id]){

		maps[map_id].eachLayer(function (layer) {
		    maps[map_id].removeLayer(layer);
		});
		
		maps[map_id].off();
		maps[map_id].remove();
		
		delete(maps[map_id]);
	    }

	    if (panes[map_id]){
		delete(panes[map_id]);
	    }

	},
	
	// This is a fork of aaronland.maps.getMap' to set protomaps rules
	// explcitly. Basically I am still rinsing-and-repeating the how
	// and what of common SFO Museum maps Javascript code.
	
	'getMap': function(map_el, args){

	    if (! args){
		args = {};
	    }
	    
	    var map_id = map_el.getAttribute("id");

	    if (! map_id){
		return;
	    }
	    
	    if (maps[map_id]){
		return maps[map_id];
	    }

	    var map_args = {
		// preferCanvas: true,
	    };

	    var map = L.map(map_el, map_args);
	    
	    var map_provider = map_el.getAttribute("data-map-provider");

	    switch (map_provider) {

		case "leaflet":

		    var tile_url = document.body.getAttribute("data-leaflet-tile-url");

		    var layer = L.tileLayer(tile_url);
		    layer.addTo(map);
		    break;
		    
		case "protomaps":
		
		    var tile_url = sfomuseum.maps.protomaps.tileURL(args);

		    var layer = sfomuseum.maps.protomaps.tileLayer(tile_url, args);
		    layer.addTo(map);
		    break;
		    
		default:
		    console.log("Unsupported map provider ", map_provider);
	    }

	    // var attribution = self.getAttribution(map_provider);
	    // map.attributionControl.addAttribution(attribution);

	    if (! panes[map_id]){

		var halo_pane = map.createPane("wayfinding-halo");
		halo_pane.style.zIndex = 9950;

		var segments_pane = map.createPane("wayfinding-segments");
		segments_pane.style.zIndex = 9975;
		
		var wayfinding_pane = map.createPane("wayfinding");
		wayfinding_pane.style.zIndex = 10000;

		var popup_pane = map.createPane("wayfinding-popup");
		popup_pane.style.zIndex = 11000;
		
		panes[map_id] = {
		    'halo': halo_pane,
		    'wayfinding': wayfinding_pane,
		    'popup': popup_pane,
		    'segments': segments_pane,
		};
	    }

	    sfomuseum.maps.campus.addCampusLayer(map);
	    sfomuseum.maps.campus.addComplexLayer(map);

	    var bounds = sfomuseum.maps.campus.campusBounds();
	    map.setMaxBounds(bounds);
	    map.setMinZoom(11);

	    if (L.control.resizer){
		var rs = L.control.resizer({ direction: 's' });
		rs.addTo(map);
	    }
	    
	    maps[map_id] = map;
	    return map;
	},

	'resetToCampus': function(map){
	    var bounds = sfomuseum.maps.campus.campusBounds();
	    map.fitBounds(bounds);
	},

	'resetToTerminals': function(map){

	    var bounds = [
		[ 37.610449,-122.393473 ],
		[ 37.621206,-122.380808] ,
	    ];
	    
	    map.fitBounds(bounds);
	},
		    
    };

    return self

})();
