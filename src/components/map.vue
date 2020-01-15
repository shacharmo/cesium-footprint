<template>
  <div class="viewer">
    <vc-viewer class="viewer" :camera="camera" @ready="ready"> 
      <vc-layer-imagery>
        <vc-provider-imagery-openstreetmap></vc-provider-imagery-openstreetmap>
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
      }
    },
    methods: {
      ready(cesiumInstance) {
        const { Cesium, viewer } = cesiumInstance
        this.viewer = viewer;
        this.cesium = Cesium;
        this.$emit('ready');
      }
    }
  }
</script>