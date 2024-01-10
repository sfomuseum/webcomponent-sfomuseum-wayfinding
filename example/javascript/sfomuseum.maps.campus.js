// This is work in progress and will nothing is settled yet.
var sfomuseum = sfomuseum || {};
sfomuseum.maps = sfomuseum.maps || {};

sfomuseum.maps.campus = (function(){

    // Could this be made less confusing by doing something like:
    //
    // var c = new sfomuseum.maps.Campus(map);
    // c.addCampusLayer();
    // c.addComplexLayer();
    //
    // Where each instance of 'c' would contain atomic and isolated
    // instances of layer groups, layers and panes. Perhaps, but not
    // today. Also, one advantage of having all the campus layers
    // here is that it allows to act on all of them (for example multiple
    // maps on a single page) at once.
    
    var layer_groups = {};
    
    var campus_panes = {};
    var complex_panes = {};
    var aerial_panes = {};

    var campus_layers = {};
    var complex_layers = {};
    var aerial_layers = {};
    
    var aerial_layers_controls = {};
    var aerial_toggle_controls = {};
    
    var sfo_blue = "#2981a2";
    var sfom_gold = "#8a741d";
    var sfba_blue = "#354855";
    var campus_grey = "#eeeeee";

    var sw = [37.393073, -122.623901];
    var ne = [ 37.828226, -120.971832 ];

    var campus_bounds;

    var callbacks = {
	'add': null,
	'change': null,
	'remove': null,
	'toggle': null,
    };
    
    var self = {

	'mapId': function(map){
	    var map_el = map.getContainer();
	    return map_el.getAttribute("id");
	},

	'registerCallback': function(label, cb){
	    // check whether callback.key(label) exists
	    callbacks[label] = cb;
	},
	
	'addCampusLayer': function(map){

	    var map_id = self.mapId(map);

	    var campus_pane_name = "campus-" + map_id;

	    var campus_args = {
		"pane": campus_pane_name,
		"color": "#000",
		"weight": 1,
		"opacity": 1,
		"fillColor": campus_grey,
		"fillOpacity":1.0,
		"minZoom": 10,
	    };
	    
	    if (! layer_groups[map_id]){
		layer_groups[map_id] = L.layerGroup();
	    }
	    
	    if (! campus_panes[map_id]){
		campus_panes[map_id] = map.createPane(campus_pane_name);
		campus_panes[map_id].style.zIndex = 3000;
	    }

	    campus_layer = L.geoJSON(_campus, campus_args);	    
	    campus_layer.addTo(map);

	    layer_groups[map_id].addLayer(campus_layer);
	    campus_layer_id = layer_groups[map_id].getLayerId(campus_layer);

	    campus_layers[map_id] = {
		"layer": campus_layer,
		"layer_id": campus_layer_id,
	    };
	    
	    return campus_layer;
	},

	'removeCampusLayer': function(map){
	    
	    var map_id = self.mapId(map);	    

	    var campus_layer = campus_layers[map_id].layer;
	    
	    layer_groups[map_id].removeLayer(campus_layer);
	    delete(campus_layers[map_id]);
	},

	'addComplexLayer': function(map){

	    var map_id = self.mapId(map);

	    var complex_pane_name = "complex-" + map_id;

	    var complex_args = {
		"pane": complex_pane_name,
		"color": "#000",
		"weight": 1,
		"opacity": 1,
		"fillColor": "#fff", // sfom_gold,
		"fillOpacity":0.9, // 1.0,
		"minZoom": 10,
	    };
	    
	    if (! layer_groups[map_id]){
		layer_groups[map_id] = L.layerGroup();
	    }

	    if (! complex_panes[map_id]){
		complex_panes[map_id] = map.createPane(complex_pane_name);
		complex_panes[map_id].style.zIndex = 4000;
	    }

	    // Note that the terminal complex feature is referred as "_campus" in the sfomuseum.millsfield.map.bundle.js file

	    complex_layer = L.geoJSON(_complex, complex_args);	    
	    complex_layer.addTo(map);

	    layer_groups[map_id].addLayer(complex_layer);
	    complex_layer_id = layer_groups[map_id].getLayerId(complex_layer);

	    complex_layers[map_id] = {
		layer: complex_layer,
		layer_id: complex_layer_id,
	    };
	    
	    return complex_layer;
	},

	'removeComplexLayer': function(map){

	    var map_id = self.mapId(map);

	    var complex_layer = complex_layers[map_id];
	    
	    layer_groups[map_id].removeLayer(complex_layer);
	    delete(complex_layers[map_id]);
	},

	'addAerialControls': function(map){
	    self.addAerialLayersControls(map);
	},

	'addAerialLayersControls': function(map){

	    var map_id = self.mapId(map);

	    var aerial_pane_name = "aerial-" + map_id;
	    
	    if (aerial_layers_controls[map_id]){
		return;
	    }

	    if (! layer_groups[map_id]){
		layer_group[map_id] = L.layerGroup();
	    }

	    if (! aerial_panes[map_id]){
		aerial_panes[map_id] = map.createPane(aerial_pane_name);
		aerial_panes[map_id].style.zIndex = 5000;
	    }

	    var args = {
		pane: aerial_pane_name,
	    };

	    var on_add = function(layer_def){

		var cb = callbacks["add"];
		
		if (cb){
		    cb(map, layer_def);
		}
	    };

	    var on_change = function(layer_def){
		
		self.addAerialLayer(map, layer_def);

		var cb = callbacks["change"];
		
		if (cb){
		    cb(map, layer_def);
		}
	    };

	    var on_remove = function(layer_def, next_layer){

		self.removeAerialLayer(map);

		var cb = callbacks["remove"];
		
		if (cb){
		    cb(map, layer_def, next_layer);
		}
	    };

	    var current_year = sfomuseum.maps.aerial.getCurrentYear(map);

	    aerial_layers_controls[map_id] = new L.Control.Layers({
		catalog: sfomuseum.maps.catalog.data(),
		selected: current_year,
		on_add: on_add,
		on_remove: on_remove,
		on_change: on_change,
		layer_args: args,
	    });

	    map.addControl(aerial_layers_controls[map_id]);

	    if (sfomuseum.maps.aerial.isValidYear(current_year)){
		self.addAerialToggleControls(map);
	    }
	},

	'ensureMapInCampus': function(map){
	    map.on("moveend", function(){
		self.isMapInCampus(map);
	    });

	    self.isMapInCampus(map);
	},
	
	'addAerialLayersHash': function(map){
	    
	    var map_id = self.mapId(map);
	    
	    var on_parse =  function(map, hash){

		var context = hash['context'];	    
		
		if (context != "bg"){
		    context = "fg";
		}
		
		self.setAerialLayerFocus(map, context);
		return;
	    };
	    
	    var on_format = function(){
		
		// Remember that year is considered to be the "label" and so it
		// is handled by L.Control.Layers
		
		var extras = [];	

		var current_year = sfomuseum.maps.aerial.getCurrentYear(map);

		if (sfomuseum.maps.aerial.isValidYear(current_year)){
		    var current_focus = sfomuseum.maps.aerial.getCurrentFocus(map);
		    extras.push(current_focus);
		}
		
		return extras;
	    };

	    aerial_layers_controls[map_id].addHash(on_parse, on_format);
	},

	'removeAerialLayersControls': function(map){

	    var map_id = self.mapId(map);
	
	    if (! aerial_layers_controls[map_id]){
		return;
	    }

	    map.removeControl(aerial_layers_controls[map_id]);
	    delete(aerial_layers_controls[map_id]);
	},

	'addAerialToggleControls': function(map){

	    var map_id = self.mapId(map);
	    
	    if (aerial_toggle_controls[map_id]){
		return;
	    }

	    var on_change = function(){
		
		var current_focus = sfomuseum.maps.aerial.getCurrentFocus(map);
		var new_focus = (current_focus == "fg") ? "bg": "fg";
		self.setAerialLayerFocus(map, new_focus);

		var cb = callbacks["toggle"];
		
		if (cb){
		    cb(map, new_focus);
		}
	    };

	    aerial_toggle_controls[map_id] = new L.Control.Toggle({
		on_change: on_change,
		position: "topright",
	    });
	    
	    map.addControl(aerial_toggle_controls[map_id]);
	},

	'setAerialLayerFocus': function(map, new_focus){

	    // fg means the aerial map is covering the contemporary campus
	    // bg means the contemporary campus hovers over the aerial map
	    
	    var map_id = self.mapId(map);
	    
	    if (new_focus == "fg"){	
		aerial_panes[map_id].style.zIndex = 5000;
		self.fillCampusAndComplex(map);		
	    } else {
 		aerial_panes[map_id].style.zIndex = 2000;
		self.fadeCampusAndComplex(map);
	    }
	    
	    sfomuseum.maps.aerial.setCurrentFocus(map, new_focus);
	    aerial_layers_controls[map_id].updateHash(map);
	},
	
	'removeAerialToggleControls': function(map){

	    var map_id = self.mapId(map);
	    
	    if (! aerial_toggle_controls[map_id]){
		return;
	    }

	    map.removeControl(aerial_toggle_controls[map_id]);
	    delete(aerial_toggle_controls[map_id]);
	},
	
	'setAerialLayer': function(map, layer_def){

	    var map_id = self.mapId(map);

	    if (! aerial_layers_controls[map_id]){
		return;
	    }

	    aerial_layers_controls[map_id].setLayer(layer_def);
	},

	'addAerialLayer': function(map, layer_def){

	    self.removeAerialLayer(map);

	    var map_id = self.mapId(map);
	    
	    if (! layer_groups[map_id]){
		layer_groups[map_id] = L.layerGroup();
	    }

	    var aerial_pane_name = "aerial-" + map_id;
	    
	    var url = layer_def["url"];
	    var year = layer_def["year"];

	    var min_zoom = layer_def["min_zoom"];
	    var max_zoom = layer_def["max_zoom"];

	    var args = {
		"minZoom": min_zoom,
		"maxZoom": max_zoom,
		"pane": aerial_pane_name,
	    };
	    

	    aerial_layer = L.tileLayer(url, args);
	    aerial_layer.addTo(map);
	    
	    layer_groups[map_id].addLayer(aerial_layer);
	    aerial_layer_id = layer_groups[map_id].getLayerId(aerial_layer);
	    
	    aerial_layers[map_id] = {
		layer: aerial_layer,
		layer_id: aerial_layer_id,
	    };
	    
	    sfomuseum.maps.aerial.setCurrentYear(map, layer_def["year"]);
	    sfomuseum.maps.aerial.updateCreditline(map);

	    self.addAerialToggleControls(map);
	    self.fadeCampusAndComplex(map);

	    var zoom = map.getZoom();

	    if ((zoom < min_zoom)){
		map.setZoom(min_zoom);
	    }

	    if ((zoom > max_zoom)){
		map.setZoom(max_zoom);
	    }

	    var campus_bounds = self.campusBounds();
	    var center = map.getCenter();

	    if (! campus_bounds.contains(center)){
		map.flyToBounds(campus_bounds);
	    }
	},

	'removeAerialLayer': function(map){

	    var map_id = self.mapId(map);
	    
	    if (! aerial_layers[map_id]){
		return;
	    }

	    map.removeLayer(aerial_layers[map_id].layer);
	    
	    layer_groups[map_id].removeLayer(aerial_layers[map_id].layer);
	    
	    delete(aerial_layers[map_id]);
	    
	    sfomuseum.maps.aerial.setCurrentYear(map, -1);
	    sfomuseum.maps.aerial.updateCreditline(map);

	    self.removeAerialToggleControls(map);
	    self.fillCampusAndComplex(map);
	},

	'campusBounds': function(){

	    if (! campus_bounds){

		campus_bounds = L.latLngBounds(
		    [ _campus["bbox"][1], _campus["bbox"][0] ],
		    [ _campus["bbox"][3], _campus["bbox"][2] ],
		);
	    }

	    return campus_bounds;
	},

	'isMapInCampus': function(map){

	    var zoom = map.getZoom();
	    var map_bounds = map.getBounds();
	    var campus_bounds = self.campusBounds();

	    var in_campus = ((zoom >= 10) && map_bounds.overlaps(campus_bounds));

	    if (! in_campus){
		self.removeAerialLayersControls(map);
		self.removeAerialToggleControls(map);
	    } else {
		self.addAerialLayersControls(map);
	    }
	},

	'fadeCampusAndComplex': function(map){
	    var map_id = self.mapId(map);
	    campus_layers[map_id].layer.setStyle({'fillOpacity': .5});
	    complex_layers[map_id].layer.setStyle({'fillOpacity': .75});
	},

	'fillCampusAndComplex': function(map){
	    var map_id = self.mapId(map);	    
	    campus_layers[map_id].layer.resetStyle();
	    complex_layers[map_id].layer.resetStyle();
	},
    };

    return self;

})();
