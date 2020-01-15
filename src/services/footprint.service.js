export function pickEllipsoid(cesium, camera, x, y) {
    const cartesian = camera.pickEllipsoid(new cesium.Cartesian2(x, y));
    const cartographicRadians = cesium.Cartographic.fromCartesian(cartesian);
    const cartographicDegrees = [cesium.Math.toDegrees(cartographicRadians.longitude),
                                 cesium.Math.toDegrees(cartographicRadians.latitude)];
    return cartographicDegrees;
}