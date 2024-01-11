var sfomuseum = sfomuseum || {};
sfomuseum.maps = sfomuseum.maps || {};

sfomuseum.maps.protomaps = (function(){

    let PAINT_RULES = [
	{
            dataLayer:"water",
            symbolizer:new protomaps.PolygonSymbolizer({fill:"#354855"})
        },
	{
	    dataLayer: "roads",
	    symbolizer: new protomaps.LineSymbolizer({color:"#fff"}),
	},
	{
	    dataLayer: "landuse",
            symbolizer:new protomaps.PolygonSymbolizer({fill:"#cccccc"})
	},
	{
	    dataLayer: "landuse",
            symbolizer:new protomaps.PolygonSymbolizer({fill:"#999"}),
	    filter: (props, ignore) => {
		
		if (props["area:aeroway"] == "runway"){
		    return true;
		}
		
		if (props["area:aeroway"] == "taxiway"){
		    return true;
		}
		
		if (props["aeroway"] == "runway"){
		    return true;
		}
		
		if (props["aeroway"] == "aerodrome"){
		    return true;
		}
		
		return false;
	    }
	},
	{
	    dataLayer: "transit",
	    symbolizer: new protomaps.LineSymbolizer({color:"#000"}),
	    filter: (props, ignore) => {
		
		if (props["pmap:kind"] = "aeroway"){
		    return true;
		}
		
		return false;
	    }
	}
    ];
    
    // https://github.com/protomaps/protomaps.js/blob/694beec8460fffd057051e6d310cb8de32f3731d/examples/labels.html
    // https://github.com/protomaps/protomaps.js/blob/0ec4a8987510627e5168a2a034e24512108042c3/src/symbolizer.ts#L682

    let LABEL_RULES = [
	{
            dataLayer: "places",
            symbolizer: new protomaps.CenteredTextSymbolizer({
                label_props:["name:en", "name"],
                fill:"black",
		stroke:"white",
		width:2,
                font:"500 14px sans-serif",
		lineHeight:1.3,
            }),
            filter: (z,f) => { 

		// console.log(z, f.props["pmap:kind"]);

		if ((z >= 3) && (f.props["pmap:kind"] == "country")){
		    return true;
		}

		if ((z >= 5) && (f.props["pmap:kind"] == "city")){

		    if ((z <= 10) && (f.props["population"] < 500000)){
			return false;
		    }
		    return true
		}
		
		if ((z >= 12) && (f.props["pmap:kind"] == "town")){
		    return true;
		}

		return false;
	    }
        },
	{
            dataLayer: "landuse",
            symbolizer: new protomaps.CenteredTextSymbolizer({
                label_props:["name:en", "name"],
                fill:"black",
		stroke:"white",
		width:2,
                font:"500 14px sans-serif",
		lineHeight:1.5,
            }),
            filter: (z,f) => {
		if (f.props["pmap:kind"] != "aerodrome"){
		    return false;
		}
		if (f.props["name"] == "San Francisco International Airport"){
		    return false;
		}
		return true;
	    }
        }

    ];
    
    var self = {
	'paint_rules': function(){
	    return PAINT_RULES;
	},
	'label_rules': function(){
	    return LABEL_RULES;
	},
	'tileURL': function(args){
	    return "https://static.sfomuseum.org/pmtiles/sfomuseum_v3/{z}/{x}/{y}.mvt?key=" + args["api_key"];
	},
	'tileLayer': function(tile_url, args){

	    var paint_rules = sfomuseum.maps.protomaps.paint_rules();
	    var label_rules = sfomuseum.maps.protomaps.label_rules();
	    
	    var pm_args = {
		url: tile_url,
		paint_rules: paint_rules,
		label_rules: label_rules,		
	    };
	    
	    return protomaps.leafletLayer(pm_args);
	}

    };

    return self;

})();
