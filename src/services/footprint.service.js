const MIN_COS_PITCH = 0.0000000001;

class Matrix3x3 {
    a11;
    a12;
    a13;

    a21;
    a22;
    a23;

    a31;
    a32;
    a33;
}

export function pickEllipsoid(cesium, camera, x, y) {
    const cartesian = camera.pickEllipsoid(new cesium.Cartesian2(x, y));
    const cartographicRadians = cesium.Cartographic.fromCartesian(cartesian);
    const cartographicDegrees = [cesium.Math.toDegrees(cartographicRadians.longitude),
                                 cesium.Math.toDegrees(cartographicRadians.latitude)];
    return cartographicDegrees;
}

export function pickPosition(cesium, viewer, x, y) {
    const position = new cesium.Cartesian2(x, y);
    const cartesian = viewer.scene.pickPosition(position);
    const cartographicRadians = cesium.Cartographic.fromCartesian(cartesian);
    const cartographicDegrees = [cesium.Math.toDegrees(cartographicRadians.longitude),
        cesium.Math.toDegrees(cartographicRadians.latitude)];
    return cartographicDegrees;
}

export function safeASin(x) {
    const safeX = Math.min(Math.max(x, -1), 1);
    return Math.asin(safeX);
}

export function safeACos(x) {
    const safeX = Math.min(Math.max(x, -1), 1);
    return Math.acos(safeX);
}

export function createRotationMatrix(psi, theta, phi) {
    const matrix = new Matrix3x3();

    matrix.a11 = Math.cos(psi) * Math.cos(theta);
    matrix.a12 = Math.cos(theta) * Math.sin(psi);
    matrix.a13 = -Math.sin(theta);

    matrix.a21 = Math.cos(psi) * Math.sin(theta) * Math.sin(phi) - Math.cos(phi) * Math.sin(psi);
    matrix.a22 = Math.cos(psi) * Math.cos(phi) + Math.sin(psi) * Math.sin(theta) * Math.sin(phi);
    matrix.a23 = Math.cos(theta) * Math.sin(phi);

    matrix.a31 = Math.sin(psi) * Math.sin(phi) + Math.cos(psi) * Math.cos(phi) * Math.sin(theta);
    matrix.a32 = Math.cos(phi) * Math.sin(psi) * Math.sin(theta) - Math.cos(psi) * Math.sin(phi);
    matrix.a33 = Math.cos(theta) * Math.cos(phi);

    return matrix;
}

export function multiplyMatrices(matrix1, matrix2) {
    const result = new Matrix3x3();

    result.a11 = matrix1.a11 * matrix2.a11 + matrix1.a12 * matrix2.a21 + matrix1.a13 * matrix2.a31;
    result.a12 = matrix1.a11 * matrix2.a12 + matrix1.a12 * matrix2.a22 + matrix1.a13 * matrix2.a32;
    result.a13 = matrix1.a11 * matrix2.a13 + matrix1.a12 * matrix2.a23 + matrix1.a13 * matrix2.a33;

    result.a21 = matrix1.a21 * matrix2.a11 + matrix1.a22 * matrix2.a21 + matrix1.a23 * matrix2.a31;
    result.a22 = matrix1.a21 * matrix2.a12 + matrix1.a22 * matrix2.a22 + matrix1.a23 * matrix2.a32;
    result.a23 = matrix1.a21 * matrix2.a13 + matrix1.a22 * matrix2.a23 + matrix1.a23 * matrix2.a33;

    result.a31 = matrix1.a31 * matrix2.a11 + matrix1.a32 * matrix2.a21 + matrix1.a33 * matrix2.a31;
    result.a32 = matrix1.a31 * matrix2.a12 + matrix1.a32 * matrix2.a22 + matrix1.a33 * matrix2.a32;
    result.a33 = matrix1.a31 * matrix2.a13 + matrix1.a32 * matrix2.a23 + matrix1.a33 * matrix2.a33;

    return result;
}

export function getAnglesFromMatrix(matrix) {
    const pitch = safeASin(-matrix.a13);

    let cosPitch = Math.cos(pitch);
    if (cosPitch < MIN_COS_PITCH) {
        cosPitch = MIN_COS_PITCH;
    }

    let heading = safeACos(matrix.a11 / cosPitch);
    if (matrix.a12 / cosPitch < 0) {
        heading = 2 * Math.PI - heading;
    }

    const roll = safeASin(matrix.a23 / cosPitch);

    return { heading, pitch, roll };
}

export function getEulerAngles(cesium, platform, sensor) {
    const platformHeading = cesium.Math.toRadians(platform.heading);
    const platformPitch = cesium.Math.toRadians(platform.pitch);
    const platformRoll = cesium.Math.toRadians(platform.roll);
    const platformMatrix = createRotationMatrix(platformHeading, platformPitch, platformRoll);

    const sensorHeading = cesium.Math.toRadians(sensor.heading);
    const sensorPitch = cesium.Math.toRadians(sensor.pitch);
    const sensorRoll = cesium.Math.toRadians(sensor.roll);
    const sensorMatrix = createRotationMatrix(sensorHeading, sensorPitch, sensorRoll);

    const matrix = multiplyMatrices(sensorMatrix, platformMatrix);
    return getAnglesFromMatrix(matrix);
}

export function getEulerAnglersUsingCesium(cesium, position, platform, sensor) {
    // position = cesium.Cartesian3.fromDegrees(position.lon, position.lat, position.alt);
    position = new cesium.Cartesian3();
    const platformOrientation = new cesium.HeadingPitchRoll(cesium.Math.toRadians(platform.heading),
        cesium.Math.toRadians(platform.pitch), cesium.Math.toRadians(platform.roll));
    const sensorOrientation = new cesium.HeadingPitchRoll(cesium.Math.toRadians(sensor.heading),
        cesium.Math.toRadians(sensor.pitch), cesium.Math.toRadians(sensor.roll));

    const platfromRotation = cesium.Matrix3.fromHeadingPitchRoll(platformOrientation);
    const sensorRotation = cesium.Matrix3.fromHeadingPitchRoll(sensorOrientation);
    const rotation = cesium.Matrix3.multiply(platfromRotation, sensorRotation, new cesium.Matrix3());
    const quat = cesium.Quaternion.fromRotationMatrix(rotation);
    const orientation = cesium.HeadingPitchRoll.fromQuaternion(quat);
    return { h: orientation.heading, p: orientation.pitch, r: orientation.roll }

    // const platformQuat = cesium.Transforms.headingPitchRollQuaternion(position, platformOrientation,
    //     cesium.Ellipsoid.WGS84, cesium.Transforms.northEastDownToFixedFrame);
    // const sensorQuat = cesium.Quaternion.fromHeadingPitchRoll(sensorOrientation);
    // const quat = cesium.Quaternion.multiply(platformQuat, sensorQuat, new cesium.Quaternion(0, 0, 0, 0));
    // //eslint-disable-next-line
    // const orientation = cesium.HeadingPitchRoll.fromQuaternion(quat);
    //
    // return { h: orientation.heading, p: orientation.pitch, r: orientation.roll }
}
