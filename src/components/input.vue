<template>
  <div class="container" v-bind:class="{ disabled: !isReady }" >
      <ul>
          <li>Position:</li>
          <li><label class="label">Latitude:</label><input class="input" type="text" v-model="position.lat" @paste="onPaste" /></li>
          <li><label class="label">Longitude:</label><input class="input" type="text" v-model="position.lon" /></li>
          <li><label class="label">Altitude:</label><input class="input" type="text" v-model="position.alt" /></li>
          <li>Platform:</li>
          <li><label class="label">Heading:</label><input class="input" type="text" v-model="platform.heading" /></li>
          <li><label class="label">Pitch:</label><input class="input" type="text" v-model="platform.pitch" /></li>
          <li><label class="label">Roll:</label><input class="input" type="text" v-model="platform.roll" /></li>
          <li>Sensor:</li>
          <li><label class="label">Heading:</label><input class="input" type="text" v-model="sensor.heading" /></li>
          <li><label class="label">Pitch:</label><input class="input" type="text" v-model="sensor.pitch" /></li>
          <li><label class="label">Roll:</label><input class="input" type="text" v-model="sensor.roll" /></li>
          <li>Field of view:</li>
          <li><label class="label">Horizontal:</label><input class="input" type="text" v-model="fov.horizontal" /></li>
          <li><label class="label">vertical:</label><input class="input" type="text" v-model="fov.vertical" /></li>
          <li>Options:</li>
          <li><input type="checkbox" v-model="useTerrain" />Use terrain?</li>
          <li><input type="checkbox" v-model="manualRays" />Manual rays?</li>
          <li><button class="button" @click="setView">set view</button></li>
          <li><button class="button" @click="calculate">calculate</button></li>
      </ul>
  </div>
</template>

<script>
export default {
    name: "Input",
    props: ['isReady'],
    data() {
        return {
            position: {
              lat: 33.752849611338625, // 35.6,
              lon: 35.308811215361956, // 32.7,
              alt: 7879.563591973754, // 5000,
            },
            platform: {
                heading: 33.79995422293431, // 10,
                pitch: 3.674428540910062, // -90,
                roll: 5.703909421063876 // 4
            },
            sensor: {
                heading: 52.600471510691676, // 1,
                pitch: -18.87945554167007, //,
                roll: 0 // 3
            },
            fov: {
                horizontal: 0.6509498741130694, // 3,
                vertical: 0.34058136873426414 // 3
            },
            manualRays: false,
            useTerrain: true
        }
    },
    methods: {
        setView() {
            //eslint-disable-next-line
            this.$emit('setView', {
                position: this.position,
                platform: this.platform,
                sensor: this.sensor,
                fov: this.fov
            });
        },
        calculate() {
            this.$emit('calculate', {
                manualRays: this.manualRays,
                useTerrain: this.useTerrain
            });
        },
        onPaste(e) {
            const text = e.clipboardData.getData('text');
            if (text.includes(',') || text.includes('\t')) {
                // TODO support parsing of csv row
                let cells = text.split(',');
                if (cells.length === 1) {
                    cells = text.split('\t');
                }
                //eslint-disable-next-line
                console.log(cells);
                this.$set(this, 'position', { lat: parseFloat(cells[1]), lon: parseFloat(cells[2]), alt: parseFloat(cells[3]) });
                this.$set(this, 'platform', { heading: parseFloat(cells[4]), pitch: parseFloat(cells[5]), roll: parseFloat(cells[6]) });
                this.$set(this, 'sensor', { heading: parseFloat(cells[7]), pitch: parseFloat(cells[8]), roll: parseFloat(cells[9]) });
                this.$set(this, 'fov', { horizontal: parseFloat(cells[10]), vertical: parseFloat(cells[11]) });
                e.preventDefault();
            }
        }
    }
}
</script>

<style scoped>
.container {
    min-width: 300px;
    align-items: center;
}

.disabled { 
    pointer-events: none;
    opacity: 0.5;
    background: #cccccc;
}

.label {
    margin-right: 15px;
    min-width: 100px;
    text-align: left;
}

.input {
    flex-grow: 1;
    margin-right: 5px;
}

ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}

li {
    margin: 0;
    margin-bottom: 5px;
    padding: 0;
    display: flex;
    width: 300px;
}
</style>
