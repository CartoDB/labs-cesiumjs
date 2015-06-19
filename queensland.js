var cartodbUser = 'solutions';

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
            new Cesium.CartoDBImageryProvider({ url: tileObj.tiles.tiles[0]}),
            tileObj.alpha,
            tileObj.show,
            tileObj.key
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

function addAdditionalLayerOption(name, imageryProvider, alpha, show, key) {
    var layer = imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = Cesium.defaultValue(alpha, 0.5);
    layer.show = Cesium.defaultValue(show, true);
    layer.name = name;
    cesiumLayers[key] = layer;
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
    var cdb_layers = {
        ward_offices : {
            user_name: cartodbUser,
            sublayers: [{
                sql: 'SELECT * FROM ward_offices',
                "cartocss_version":"2.1.0",
                cartocss: '#ward_offices {polygon-opacity: 0.7; line-color: #FFF; line-width: 1.5; line-opacity: 1; } #ward_offices[political_="ALP"] {polygon-fill: #b20838; } #ward_offices[political_="IND"] {polygon-fill: #FFA300; } #ward_offices[political_="LNP"] {polygon-fill: #163260; }'
                }]
        },
        qualifications: {
            user_name: cartodbUser,
            sublayers:[{
                sql: 'SELECT a.* FROM solutions.high_qualification a, solutions.qld_border b WHERE ST_Intersects(ST_Centroid(a.the_geom), b.the_geom)',
                "cartocss_version":"2.1.0",
                cartocss: '#high_qualification{polygon-fill: #FFFFCC; polygon-opacity: 0.8; line-color: #FFF; line-width: 0; line-opacity: 1; } #high_qualification [ bach_degre <= 51] {polygon-fill: #0C2C84; } #high_qualification [ bach_degre <= 37] {polygon-fill: #225EA8; } #high_qualification [ bach_degre <= 31] {polygon-fill: #1D91C0; } #high_qualification [ bach_degre <= 24] {polygon-fill: #41B6C4; } #high_qualification [ bach_degre <= 18] {polygon-fill: #7FCDBB; } #high_qualification [ bach_degre <= 12] {polygon-fill: #C7E9B4; } #high_qualification [ bach_degre <= 7] {polygon-fill: #FFFFCC; }'
            }]
        },
        protected_areas : {
            user_name: cartodbUser,
            sublayers:[{
                sql: 'SELECT nameabbrev,  st_union(st_buffer(the_geom_webmercator,40)) as the_geom_webmercator FROM protected_areas GROUP BY nameabbrev',
                "cartocss_version":"2.1.0",
                cartocss: 'Map {buffer-size: 256;} #protected_areas {polygon-opacity: 0.9; polygon-fill: #229A00; line-color: darken(#229A00, 10%); line-width: 0.5; line-opacity: 1; } #protected_areas::labels[zoom>9] {text-name: [nameabbrev]; text-face-name: \'Lato Regular\'; text-size: 14; text-label-position-tolerance: 10; text-fill: #000; text-halo-fill: #FFF; text-halo-radius: 2; text-dy: 0; text-allow-overlap: false; text-placement: interior; text-placement-type: simple; }'
            }]
        },
        roads: {
            user_name: cartodbUser,
            sublayers:[{
                sql: 'SELECT * FROM state_controlled_roads where carrway is not null ',
                "cartocss_version":"2.1.0",
                cartocss: '#state_controlled_roads{line-color: #B81609; line-width: 1.5; line-opacity: 1; [zoom > 8]{[carrway = \'2\']{line-width: 3; } [carrway = \'3\']{line-width: 3; } } }'
            }]
        }
    };

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

        //cartodb.Tiles.getTiles(cdb_layers['populated_places'], function (tilesNEarth, err) {
        cartodb.Tiles.getTiles(cdb_layers['ward_offices'], function (tilesWard, err) {
            cartodb.Tiles.getTiles(cdb_layers['qualifications'], function (tilesQual, err) {
            cartodb.Tiles.getTiles(cdb_layers['protected_areas'], function (tilesProtected, err) {
            cartodb.Tiles.getTiles(cdb_layers['roads'], function (tilesRoads, err) {

        setupLayers([
            {
                name: 'Brisbane Ward Offices',
                tiles: tilesWard,
                alpha: 1,
                show: false,
                key: 'ward_offices'
            },
            {
                name: 'Farmers qualifications',
                tiles: tilesQual,
                alpha: 1,
                show: false,
                key: 'qualifications'
            },
            {
                name: 'Queensland protected areas',
                tiles: tilesProtected,
                alpha: 1,
                show: false,
                key: 'protected_areas'
            },
            {
                name: 'Queensland roads and cameras',
                tiles: tilesRoads,
                alpha: 1,
                show: false,
                key: 'roads'
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

                dataSource.loadingEvent.addEventListener(function(event,isLoading){
                    var status = $('#loadingOverlay').css('display');
                    if (isLoading && status === 'none'){
                        $('#loadingOverlay').show();
                    } else {
                        $('#loadingOverlay').hide();
                    }
                })

                var sql = new cartodb.SQL({user: cartodbUser, format: 'geoJSON'});
                sql.execute(params.sql)
                    .done(function (data) {
                        if (params.style['marker-symbol']){
                            data.features.forEach(function(feat){
                                $.extend(feat.properties,params.style);
                            });
                        }

                        dataSource.load(data)
                            .then(function () {
                                if (params.style.billboard){
                                    dataSource.entities.entities.forEach(function(e){
                                        e.billboard.image.setValue(params.style.billboard)
                                    })
                                }

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

        // ward offices
        Cesium.knockout.getObservable(cesiumLayers['ward_offices'],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'wards',
                sql : 'select councillor as "Councillor", political_ as "Party", ward as title, st_centroid(the_geom) as the_geom from ward_offices ',
                style: {
                    'billboard' : 'images/pin-council.png'
                }
            });
        });

        // bachelor degrees
        Cesium.knockout.getObservable(cesiumLayers['qualifications'],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'qualifications',
                sql : 'select a.bach_degre as "Bachelors", a.higher_deg as "High Ed", a.post_grad as "Post Grad", a.sla_name as title, st_centroid(a.the_geom) as the_geom from high_qualification a, qld_border b where ST_Intersects(ST_Centroid(a.the_geom), b.the_geom)',
                style: {
                    'billboard' : 'images/pin-college.png'
                }
            });
        });

        // protected areas
        Cesium.knockout.getObservable(cesiumLayers['protected_areas'],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'protected_areas',
                sql : 'SELECT estatename as title, legislated, qpws_reg as region, shire, st_pointonsurface(st_union(the_geom)) as the_geom FROM protected_areas GROUP BY estatename,legislated,qpws_reg,shire',
                style: {
                    'billboard' : 'images/pin-tree.png'
                }
            });
        });

        // roads
        Cesium.knockout.getObservable(cesiumLayers['roads'],'show').subscribe(function(show){
            showHideDataSource(show,{
                key : 'roads',
                sql : 'SELECT the_geom, angle, camera as title, region, url FROM state_controlled_roads_traffic_cameras WHERE enabled is not null',
                style: {
                    'billboard' : 'images/pin-camera.png'
                }
            });

            if (show){
                $('#camera').show();
                $('#camera p').show();
            } else {
                $('#camera img').remove();
                $('#camera').hide();
            }
        });


        // Selecting picking events
        var scene = viewer.scene;
        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        handler.setInputAction(function(click) {
            var pickedObject = scene.pick(click.position);
            if (Cesium.defined(pickedObject)) {
                // Move the infowindow close to the element
                $('.cesium-infoBox')
                    .css('position','absolute')
                    .css('top',click.position.y + 'px')
                    .css('left',click.position.x + 'px');


                var properties = pickedObject.id.properties;
                console.log(properties);

                if (properties.url){
                    $('#camera img').remove();
                    $('#camera p').hide();
                    $('#camera').append('<img src="' + properties.url +'">');
                }
            } else {
                $('.cesium-infoBox').removeClass('cesium-infoBox-visible');
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        handler.setInputAction(function(click) {
            var pickedObject = scene.pick(click.position);
            if (!Cesium.defined(pickedObject)) {
                $('.cesium-infoBox').removeClass('cesium-infoBox-visible');
            }
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        // zoom to a position
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var west = Cesium.Math.toRadians(135);
        var south = Cesium.Math.toRadians(-40);
        var east = Cesium.Math.toRadians(145);
        var north = Cesium.Math.toRadians(-15);
        var rotation = Cesium.Math.toRadians(10);

        var extent = new Cesium.Rectangle(west, south, east, north);
        viewer.camera.viewRectangle(extent, ellipsoid);
        viewer.camera.lookUp(rotation);

    //});
    }); }); }); }); // end getTiles
}// end main