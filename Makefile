# https://github.com/tdewolff/minify
MINIFY=minify

dist-tour:
	@make dist-tour-js
	@make dist-tour-css

dist-tour-js:
	$(MINIFY) -b \
		-o dist/sfomuseum.wayfinding.tour.webcomponent.js \
		lib/leaflet.js \
		lib/leaflet.geometryutil.js \
		lib/leaflet-arrowheads.js \
		lib/protomaps.js \
		lib/protomaps-leaflet.min.js \
		lib/wasm_exec.js \
		lib/sfomuseum.*.js \
		src/sfomuseum.wayfinding.tour.js

dist-tour-css:
	$(MINIFY) -b \
		-o dist/sfomuseum.wayfinding.tour.webcomponent.css \
		lib/leaflet.css \
		src/sfomuseum.wayfinding.leaflet.css
