/*
    code based on the layers manipulation Cesium example
    http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Imagery%20Layers%20Manipulation.html&label=Showcases
*/
function setupLayers(tiles) {
    addBaseLayerOption(
            'Bing Maps Aerial',
            undefined); // the current base layer
    addBaseLayerOption(
            'CartoDB Light',
            new Cesium.CartoDBImageryProvider({
                url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            }));
    addBaseLayerOption(
            'CartoDB Dark',
            new Cesium.CartoDBImageryProvider({
                url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            }));
    addBaseLayerOption(
            'CartoDB Flat Blue',
            new Cesium.CartoDBImageryProvider({
                url: 'https://cartocdn_a.global.ssl.fastly.net/base-flatblue/{z}/{x}/{y}.png'
            }));
    tiles.forEach(function(tileObj){
        // Create the additional layers
        addAdditionalLayerOption(
            tileObj.name,
            new Cesium.CartoDBImageryProvider({ url: tileObj.tiles.tiles[0] }),
            tileObj.alpha,
            tileObj.show
        );
    });

}

function addBaseLayerOption(name, imageryProvider) {
    var layer;
    if (typeof imageryProvider === 'undefined') {
        layer = imageryLayers.get(0);
        viewModel.selectedLayer = layer;
    } else {
        layer = new Cesium.ImageryLayer(imageryProvider);
    }

    layer.name = name;
    baseLayers.push(layer);
}

function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
    var layer = imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = Cesium.defaultValue(alpha, 0.5);
    layer.show = Cesium.defaultValue(show, true);
    layer.name = name;
    cesiumLayers.push(layer);
    Cesium.knockout.track(layer, ['alpha', 'show', 'name']);
}

function updateLayerList() {
    var numLayers = imageryLayers.length;
    viewModel.layers.splice(0, viewModel.layers.length);
    for (var i = numLayers - 1; i >= 0; --i) {
        viewModel.layers.push(imageryLayers.get(i));
    }
}


var imageryLayers, viewModel, baseLayers, cesiumLayers;

function main(){
    var viewer = new Cesium.Viewer('cesiumContainer', {
        baseLayerPicker : false,
        timeline: false,
        animation: false
    });
    imageryLayers = viewer.imageryLayers;
    cesiumLayers = [];

    viewModel = {
        layers : [],
        baseLayers : [],
        upLayer : null,
        downLayer : null,
        selectedLayer : null,
        isSelectableLayer : function(layer) {
            return baseLayers.indexOf(layer) >= 0;
        },
        raise : function(layer, index) {
            imageryLayers.raise(layer);
            viewModel.upLayer = layer;
            viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
            updateLayerList();
            window.setTimeout(function() { viewModel.upLayer = viewModel.downLayer = null; }, 10);
        },
        lower : function(layer, index) {
            imageryLayers.lower(layer);
            viewModel.upLayer = viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
            viewModel.downLayer = layer;
            updateLayerList();
            window.setTimeout(function() { viewModel.upLayer = viewModel.downLayer = null; }, 10);
        },
        canRaise : function(layerIndex) {
            return layerIndex > 0;
        },
        canLower : function(layerIndex) {
            return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
        }
    };
    Cesium.knockout.track(viewModel);

    baseLayers = viewModel.baseLayers;


    // Tile data layer (Ward offices)
    // Instantiate this layers using a different process
    var cdb_layers = [
        {
            user_name: 'jsanz',
            sublayers:[{
                sql: 'SELECT * FROM ne_10m_populated_places_simple_7',
                "cartocss_version":"2.1.0",
                cartocss: '#ne_10m_populated_places_simple_7{marker-fill-opacity: 0.6; marker-line-color: #FFF; marker-line-width: 1.5; marker-line-opacity: 1; marker-width: 14; marker-fill: #F1EEF6; marker-allow-overlap: true; marker-comp-op: darken; } #ne_10m_populated_places_simple_7 [ pop_max <= 35676000] {marker-fill: #91003F; } #ne_10m_populated_places_simple_7 [ pop_max <= 2769072] {marker-fill: #CE1256; } #ne_10m_populated_places_simple_7 [ pop_max <= 578470] {marker-fill: #E7298A; } #ne_10m_populated_places_simple_7 [ pop_max <= 345604] {marker-fill: #DF65B0; } #ne_10m_populated_places_simple_7 [ pop_max <= 139843] {marker-fill: #C994C7; } #ne_10m_populated_places_simple_7 [ pop_max <= 42097] {marker-fill: #D4B9DA; } #ne_10m_populated_places_simple_7 [ pop_max <= 41316] {marker-fill: #F1EEF6; }'
            }]
        },
        {
            user_name: 'jsanz',
            sublayers: [{
                sql: 'SELECT * FROM ward_offices',
                "cartocss_version":"2.1.0",
                cartocss: '#ward_offices {polygon-opacity: 0.7; line-color: #FFF; line-width: 1.5; line-opacity: 1; } #ward_offices[political_="ALP"] {polygon-fill: #b20838; } #ward_offices[political_="IND"] {polygon-fill: #FFA300; } #ward_offices[political_="LNP"] {polygon-fill: #163260; }'
                }]
        },{
            user_name: 'jsanz',
            sublayers:[{
                sql: 'SELECT * FROM high_qualification_4326 where bach_degre is not null',
                "cartocss_version":"2.1.0",
                cartocss: '#high_qualification_4326{polygon-fill: #FFFFCC; polygon-opacity: 0.8; line-color: #FFF; line-width: 0; line-opacity: 1; } #high_qualification_4326 [ bach_degre <= 51] {polygon-fill: #0C2C84; } #high_qualification_4326 [ bach_degre <= 37] {polygon-fill: #225EA8; } #high_qualification_4326 [ bach_degre <= 31] {polygon-fill: #1D91C0; } #high_qualification_4326 [ bach_degre <= 24] {polygon-fill: #41B6C4; } #high_qualification_4326 [ bach_degre <= 18] {polygon-fill: #7FCDBB; } #high_qualification_4326 [ bach_degre <= 12] {polygon-fill: #C7E9B4; } #high_qualification_4326 [ bach_degre <= 7] {polygon-fill: #FFFFCC; }'
            }]

        }
    ];

    /*
        TODO how to make an asynchronous call to all the urls on the calls array?
        when.all from when.js seems to be the right tool but it can't be
        loaded in this environment 

        var calls = [];

        cdb_layers.forEach(function(cdb_layer){
            var obj = {
                "version":"1.0.0",
                "stat_tag":"API",
                "layers":[{
                    "type": "cartodb",
                    "options":cdb_layer.sublayers[0]
                }]
            };
            calls.push('http://jsanz.cartodb.com/api/v1/map?stat_tag=API&config=' 
                + encodeURIComponent(JSON.stringify(obj)));
        });

        when.all(calls.map(function(call){return $.ajax(call)}))
        .done(
            function(){
                debugger; 
            }
        );*/

    cartodb.Tiles.getTiles(cdb_layers[0], function (tilesNEarth, err) {
        cartodb.Tiles.getTiles(cdb_layers[1], function (tilesWard, err) {
            cartodb.Tiles.getTiles(cdb_layers[2], function (tilesQual, err) {
        if (tilesWard == null || tilesNEarth == null) {
            console.log("error: ", err.errors.join('\n'));
            return;
        }

        setupLayers([
            {
                name: 'Natural Earth Populated Places',
                tiles: tilesNEarth,
                alpha: 1,
                show: false
            },
            {
                name: 'Brisbane Ward Offices',
                tiles: tilesWard,
                alpha: 1,
                show: false
            },
            {
                name: 'Qualifications of Farmers',
                tiles: tilesQual,
                alpha: 1,
                show: false
            }
        ]);

        updateLayerList();

        //Bind the viewModel to the DOM elements of the UI that call for it.
        var toolbar = document.getElementById('toolbar');
        Cesium.knockout.applyBindings(viewModel, toolbar);

        var datasources = {};

        Cesium.knockout.getObservable(viewModel, 'selectedLayer').subscribe(function(baseLayer) {
            // Handle changes to the drop-down base layer selector.
            var activeLayerIndex = 0;
            var numLayers = viewModel.layers.length;
            for (var i = 0; i < numLayers; ++i) {
                if (viewModel.isSelectableLayer(viewModel.layers[i])) {
                    activeLayerIndex = i;
                    break;
                }
            }
            var activeLayer = viewModel.layers[activeLayerIndex];
            var show = activeLayer.show;
            var alpha = activeLayer.alpha;
            imageryLayers.remove(activeLayer, false);
            imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
            baseLayer.show = show;
            baseLayer.alpha = alpha;
            updateLayerList();
        });


        function showHideDataSource(show,params){
            if (show){
                /*
                // SQL API layer (rendered by Cesium - bubbles)
                */
                var dataSource = new Cesium.GeoJsonDataSource();
                viewer.dataSources.add(dataSource);
                datasources[params.key] = dataSource;

                var sql = new cartodb.SQL({user: 'jsanz', format: 'geoJSON'});
                sql.execute(params.sql)
                        .done(function (data) {
                            dataSource.load(data)
                                    .then(function () {
                                    })
                        })
                        .error(function (errors) {
                            // errors contains a list of errors
                            console.log("errors:" + errors);
                        });

                console.log(params.key + " layer activated");
            } else {
                viewer.dataSources.remove(datasources[params.key]);
                console.log(params.key + " layer deactivated");
            }

        };

        // bachelor degrees
        Cesium.knockout.getObservable(cesiumLayers[0],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'populated',
                sql : 'select adm0name as ADM0, adm1name as ADM1, name as title, pop_max as "Max Population", pop_min as "Min Population",  the_geom, \'#D4B9DA\' as "marker-color", \'small\' as "marker-size" from ne_10m_populated_places_simple_7'
            });
        });

        
        // ward offices
        Cesium.knockout.getObservable(cesiumLayers[1],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'wards',
                sql : 'select councillor as "Councillor", political_ as "Party", ward as title, st_centroid(the_geom) as the_geom, \'small\' as "marker-size", \'town-hall\' as "marker-symbol" from ward_offices '
            });
        });

        // bachelor degrees
        Cesium.knockout.getObservable(cesiumLayers[2],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'qualifications',
                sql : 'select bach_degre as "Bachelors", higher_deg as "High Ed", post_grad as "Post Grad", sla_name as title, st_centroid(the_geom) as the_geom, \'small\' as "marker-size", \'college\' as "marker-symbol" from high_qualification_4326 where bach_degre is not null'
            });
        });


        // Selecting picking events
        var scene = viewer.scene;
        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        handler.setInputAction(function(click) {
            var pickedObject = scene.pick(click.position);
            if (Cesium.defined(pickedObject)) {
                console.log(pickedObject.id.properties);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        // Select the CartoDB Light layer as base
        viewModel.selectedLayer = viewModel.baseLayers[1];

        // zoom to a position
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var west = Cesium.Math.toRadians(152);
        var south = Cesium.Math.toRadians(-29);
        var east = Cesium.Math.toRadians(153.7);
        var north = Cesium.Math.toRadians(-28);
        var rotation = Cesium.Math.toRadians(30);

        var extent = new Cesium.Rectangle(west, south, east, north);
        viewer.camera.viewRectangle(extent, ellipsoid);
        viewer.camera.lookUp(rotation);  



    }); }); });
}// end main