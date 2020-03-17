<template>
    <div class="viewer">
        <vc-viewer class="viewer" :camera="camera" @ready="ready">
            <vc-layer-imagery>
<!--                <vc-provider-imagery-openstreetmap></vc-provider-imagery-openstreetmap>-->
                <vc-provider-imagery-ion :assetId="2" :access-token="accessToken"></vc-provider-imagery-ion>
            </vc-layer-imagery>
            <!-- <vc-provider-terrain-cesium></vc-provider-terrain-cesium> -->
        </vc-viewer>
    </div>
</template>

<style scoped>
    .viewer {
        /* width: 100vw; */
        height: calc(100vh - 50px);
        flex-grow: 1;
    }
</style>

<script>
    export default {
        name: 'Map',
        props: {
            camera: {
                default: {
                    position: {
                        lng: 104.06,
                        lat: 30.67,
                        height: 100000
                    },
                    heading: 360,
                    pitch: -90,
                    roll: 0
                }
            }
        },
        data() {
            return {
                viewer: undefined,
                cesium: undefined,
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjQyYTUyNS1mYTg5LTRjMTMtYmIyNC00NWFjNzExNWNkZjUiLCJpZCI6MTcxNjcsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODAwMzk1MjR9.jWYEMNz9Y6yMmO1pit-4FH3AQTaO2QRB-3UIOfKYxNw"
            }
        },
        methods: {
            ready(cesiumInstance) {
                const {Cesium, viewer} = cesiumInstance;
                this.viewer = viewer;
                this.cesium = Cesium;
                Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYTgyODU2MC1jOTgzLTQ2MGItODEwOC0wZGVhZDhjODFlNmUiLCJpZCI6MTcxNjcsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NzE3NDI0OTR9.JeCf3VC1RYMzgZwt0izM5ed9P412PbpWUzS9x6ehfyw';

                const terrainProvider = new Cesium.CesiumTerrainProvider({
                    // url: 'http://192.168.1.191:5032/dted'
                    // url: 'http://localhost:8082/tilesets/terrain2'
                    // url: 'http://localhost:8088/tilesets/part3'
                    // url: 'http://localhost:8088/tilesets/israel_and_drl'
                    url: 'http://localhost:5032/tilesets/israel_and_drl'
                });
                // const terrainProvider = new Cesium.CesiumTerrainProvider({
                //     url: Cesium.IonResource.fromAssetId(70206)
                // });
                viewer.scene.terrainProvider = terrainProvider;
                viewer.scene.globe.depthTestAgainstTerrain = true;

                let tilesLoaded = true;
                viewer.scene.globe.tileLoadProgressEvent.addEventListener(function (tiles) {
                    if (tiles > 0 && tilesLoaded) {
                        tilesLoaded = false;
                        //eslint-disable-next-line
                        console.log('Loading tiles...');
                    } else if (tiles === 0 && !tilesLoaded) {
                        tilesLoaded = true;
                        //eslint-disable-next-line
                        console.log('All tiles loaded');
                    }
                });

                var point = undefined;
                var createPoint = function (worldPosition) {
                    if (!point) {
                        point = viewer.entities.add({
                            position: worldPosition,
                            point: {
                                color: Cesium.Color.WHITE,
                                pixelSize: 5,
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                            }
                        });
                    } else {
                        point.position = worldPosition;
                    }
                    return point;
                };

                var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
                handler.setInputAction(async function (event) {
                    //eslint-disable-next-line
                    console.log('event.position', event.position);
                    // We use `viewer.scene.pickPosition` here instead of `viewer.camera.pickEllipsoid` so that
                    // we get the correct point when mousing over terrain.
                    var earthPosition = viewer.scene.pickPosition(event.position);
                    // const earthPosition = viewer.camera.pickEllipsoid(event.position);

                    // `earthPosition` will be undefined if our mouse is not over the globe.
                    if (Cesium.defined(earthPosition)) {
                        const llaPosition = Cesium.Cartographic.fromCartesian(earthPosition);
                        //eslint-disable-next-line
                        console.log(`x, Lon=${Cesium.Math.toDegrees(llaPosition.longitude)}, Lat=${Cesium.Math.toDegrees(llaPosition.latitude)}, Alt=${llaPosition.height}`);
                        createPoint(earthPosition);
                    }

                    const ray = viewer.camera.getPickRay(event.position);
                    const intersection = viewer.scene.globe.pick(ray, viewer.scene);
                    if (Cesium.defined(intersection)) {
                        const llaPosition = Cesium.Cartographic.fromCartesian(intersection);
                        //eslint-disable-next-line
                        console.log(`y, Lon=${Cesium.Math.toDegrees(llaPosition.longitude)}, Lat=${Cesium.Math.toDegrees(llaPosition.latitude)}, Alt=${llaPosition.height}`);
                        createPoint(earthPosition);
                    } else {
                        //eslint-disable-next-line
                        console.log('y, none');
                    }

                    const positions = [Cesium.Cartographic.fromCartesian(intersection)];
                    //eslint-disable-next-line
                    console.log('sampleTerrain', terrainProvider, positions);
                    const updatePositions = await Cesium.when(Cesium.sampleTerrain(terrainProvider, 10, positions));
                    //eslint-disable-next-line
                    console.log(`z, Lon=${Cesium.Math.toDegrees(updatePositions[0].longitude)}, Lat=${Cesium.Math.toDegrees(updatePositions[0].latitude)}, Alt=${updatePositions[0].height}`);
                    //eslint-disable-next-line
                    // console.log('z', updatePositions);

                    const geom = await terrainProvider.requestTileGeometry(1223, 327, 10);
                    //eslint-disable-next-line
                    console.log('geom', geom);
                    const tilingScheme = new Cesium.GeographicTilingScheme();
                    var rectangle = tilingScheme.tileXYToRectangle(1223, 327, 10);
                    const height = geom.interpolateHeight(rectangle, positions[0].longitude, positions[0].latitude);
                    //eslint-disable-next-line
                    console.log('geom height', height);
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                this.$emit('ready');
            }
        }
    }
</script>
