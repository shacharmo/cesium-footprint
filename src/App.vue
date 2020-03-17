<template>
    <div id="app">
        <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
        <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
        <div id="container">
            <Input v-on:setView="setView" v-on:calculate="calculate" :isReady="isReady"/>
            <textarea ref="polygonText" class="polygonText" v-model="polygon"/>
            <button @click="copyPolygonText">copy</button>
        </div>
        <Map ref="map" v-on:ready="ready" :camera="camera"/>
    </div>
</template>

<script>
    // import HelloWorld from './components/HelloWorld.vue'
    import Map from './components/map.vue'
    import Input from './components/input.vue'
    import {pickEllipsoid, pickPosition, getEulerAngles, getEulerAnglersUsingCesium} from './services/footprint.service';

    export default {
        name: 'app',
        components: {
            // HelloWorld
            Map,
            Input
        },
        data() {
            return {
                isReady: false,
                camera: {
                    position: {
                        lng: 35.5,
                        lat: 32.5,
                        height: 100000
                    },
                    heading: 360,
                    pitch: -90,
                    roll: 0
                },
                polygon: ""
            }
        },
        methods: {
            ready() {
                this.$set(this, 'isReady', true);
            },
            copyPolygonText() {
                this.$refs.polygonText.select();
                document.execCommand('copy');
            },
            setView({position, platform, sensor, fov}) {
                // TOOD calculate HPR using both platform and sensor (Malat code)

                const cesium = this.$refs.map.cesium;
                // TODO calculate using Cesium code and compare
                let {heading, pitch, roll} = getEulerAngles(cesium, platform, sensor);
                //eslint-disable-next-line
                let {h, p, r} = getEulerAnglersUsingCesium(cesium, position, platform, sensor);

                heading = cesium.Math.toDegrees(heading);
                pitch = cesium.Math.toDegrees(pitch);
                roll = cesium.Math.toDegrees(roll);

                h = cesium.Math.toDegrees(h);
                p = cesium.Math.toDegrees(p);
                r = cesium.Math.toDegrees(r);

                const cameraOrientation = `malat h,p,r,cesium h,p,r,h-diff,p-diff,r-diff\n${heading},` +
                    `${pitch},${roll},${h},${p},${r},${heading - h},${pitch - p},${roll -r }`;
                this.$set(this, 'polygon', cameraOrientation);

                this.$set(this, 'camera', {
                    position: {lng: position.lon, lat: position.lat, height: position.alt},
                    heading: h,
                    pitch: p,
                    roll: r
                });

                const frustum = this.$refs.map.viewer.scene.camera.frustum;
                frustum.fov = cesium.Math.toRadians(fov.horizontal);
                frustum.aspectRatio = fov.horizontal / fov.vertical;
            },
            calculate() {
                // TODO calculate view bounding polygon and log in geojson feature format
                // TODO add support for camera view bounds
                // TODO add support for terrain or elliposid (use terrain)
                // TOOD add support for manual rays calculation
                //- terrain: camera.getPickRay or scene.pickPosition or globe.pick(ray) on 4 corners (get window size using scene.drawingBufferWidth&Height )
                //- ellipsoid: camera.pickEllipsoid
                //globe.depthTestAgainstTerrain

                const cesium = this.$refs.map.cesium;
                const viewer = this.$refs.map.viewer;
                const scene = viewer.scene;
                const camera = scene.camera;
                const width = scene.drawingBufferWidth;
                const height = scene.drawingBufferHeight;

                let coordinates = null;

                const useTerrain = true; // TODO get from selection
                if (useTerrain) {
                    coordinates = [
                        pickPosition(cesium, viewer, 1, 1),
                        pickPosition(cesium, viewer, width - 1, 1),
                        pickPosition(cesium, viewer, width - 1, height - 1),
                        pickPosition(cesium, viewer, 1, height - 1),
                    ];
                } else {
                    coordinates = [
                        pickEllipsoid(cesium, camera, 0, 0),
                        pickEllipsoid(cesium, camera, width, 0),
                        pickEllipsoid(cesium, camera, width, height),
                        pickEllipsoid(cesium, camera, 0, height),
                    ];
                }
                coordinates.push(coordinates[0]);

                const center = pickEllipsoid(cesium, camera, width / 2, height / 2);

                this.$set(this, 'polygon', JSON.stringify([{
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                    },
                    properties: {}
                },
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: center
                        },
                        properties: {}
                    }], null, 2));
            }
        }
    }
</script>

<style>
    #app {
        /* font-family: 'Avenir', Helvetica, Arial, sans-serif; */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        /* margin-top: 60px; */
        display: flex;
        flex-direction: row;
    }

    #container {
        flex-direction: column
    }

    .polygonText {
        width: 100%;
        min-height: 150px;
    }
</style>
