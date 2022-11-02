const electrodeData = [
    [61.7397994995117, 139.014129638672, 178.866790771484],
    [57.0425949096680, 139.287994384766, 172.553298950195],
    [52.6332588195801, 139.174285888672, 168.291290283203],
    [49.9343223571777, 139.158569335938, 163.294281005859],
    [47.0855522155762, 139.024169921875, 158.372970581055],
    [58.0416793823242, 131.243377685547, 179.853149414063],
    [53.8179206848145, 130.746154785156, 173.396087646484],
    [50.9673805236816, 130.553924560547, 168.459442138672],
    [48.1004180908203, 130.171569824219, 163.658401489258],
    [47.0327911376953, 130.298995971680, 158.395172119141],
    [44.5878067016602, 152.413452148438, 127.619720458984],
    [46.5737419128418, 153.781738281250, 122.439125061035],
    [50.5636215209961, 155.926162719727, 118.359619140625],
    [54.1101531982422, 157.709716796875, 113.420326232910],
    [60.9065780639648, 159.683746337891, 110.268630981445],
    [45.3121032714844, 142.812438964844, 126.440490722656],
    [49.4790573120117, 145.072082519531, 121.394447326660],
    [50.6709136962891, 147.108184814453, 117.142639160156],
    [54.8323822021484, 149.705718994141, 112.750564575195],
    [60.2906494140625, 149.689758300781, 109.682693481445]
];
let gl = null;
let canvas = null;
const WIDTH = 1000;
const HEIGHT = 1000;
canvas = document.getElementById('glcanvas')

let camera = null;
const center = vec3.set(vec3.create(), 0.5, 0.5, 0.5);
let zFar = null;
let zNear = null;
let cameraPosition = null;
let cameraTarget = null;
let meshProgramInfo = null;
let objOffset = null;
let parts = null;

let range = null;

var angle = {
    x: 0,
    y: 0,
}

var mouse = {
    lastX: -1,
    lastY: -1,
}

var currzoom = 1;

var dragging = false

function mousedown(event) {
    // console.log('here')
    var x = event.clientX;
    var y = event.clientY;
    var rect = event.target.getBoundingClientRect();
    // If we're within the rectangle, mouse is down within canvas.
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        mouse.lastX = x;
        mouse.lastY = y;
        dragging = true;
    }
}

function mouseup(event) {
    dragging = false;
}

function mousemove(event) {
    // console.log('mouse moving')
    var x = event.clientX;
    var y = event.clientY;
    if (dragging) {
        // The rotation speed factor
        // dx and dy here are how for in the x or y direction the mouse moved
        var factor = 10 / gl.canvas.height;
        var dx = factor * (x - mouse.lastX);
        var dy = factor * (y - mouse.lastY);

        // update the latest angle
        angle.x = angle.x + dy;
        angle.y = angle.y + dx;
    }
    // update the last mouse position
    mouse.lastX = x;
    mouse.lastY = y;
}

function wheel(event) {
    currzoom += event.deltaY * 0.02;
    currzoom = Math.min(Math.max(1, currzoom), 500);
}

window.onload = async function () {
    console.log("window on load");
    canvas.width = 700;
    canvas.height = 700;
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("Unable to initialize WebGL2. Your browser may not support it");
        return;
    }

    canvas.addEventListener('mousemove', mousemove);
    canvas.addEventListener('mousedown', mousedown);
    canvas.addEventListener('mouseup', mouseup);
    canvas.addEventListener('wheel', wheel);

    const response = await fetch('models/brain.obj');
    const text = await response.text();
    const obj = parseOBJ(text, electrodeData);
    // console.log(obj)

    // console.log(JSON.stringify)
    parts = obj.geometries.map(({ data }) => {
        // console.log(data)
        // Because data is just named arrays like this
        //
        // {
        //   position: [...],
        //   texcoord: [...],
        //   normal: [...],
        // }
        //
        // and because those names match the attributes in our vertex
        // shader we can pass it directly into `createBufferInfoFromArrays`
        // from the article "less code more fun".
        // console.log(data)
        // if (data.color) {
        //     if (data.position.length === data.color.length) {
        //         // it's 3. The our helper library assumes 4 so we need
        //         // to tell it there are only 3.
        //         data.color = { numComponents: 3, data: data.color };
        //     }
        // } else {
        //     // there are no vertex colors so just use constant white
        //     data.color = { value: [0.840, 0.840, 0.840, 1] };
        // }

        let color = data.color
        data.color = { numComponents: 3, data: color };
        // for (let i = 0; i < data.position.length; i = i + 3) {
        //     let match = false
        //     for (let j = 0; j < electrodeData.length; j++) {
        //         if (
        //             data.position[i].toFixed(3) == electrodeData[j][0].toFixed(3) &&
        //             data.position[i + 1].toFixed(3) == electrodeData[j][1].toFixed(3) &&
        //             data.position[i + 2].toFixed(3) == electrodeData[j][2].toFixed(3)
        //         ) {
        //             // console.log([data.position[i], data.position[i + 1], data.position[i + 2]], electrodeData[j])
        //             // console.log("true")
        //             data.color.data.push(1.0, 0.0, 0.0)
        //             match = true;
        //             break;
        //         }
        //     }
        //     if (match == false) {
        //         data.color.data.push(0.840, 0.840, 0.840)
        //     }

        // }
        // create a buffer for each array by calling
        // gl.createBuffer, gl.bindBuffer, gl.bufferData
        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
        return {
            material: {
                u_diffuse: [1, 1, 1, 1],
            },
            bufferInfo,
        };
    });

    // console.log(parts)

    // compiles and links the shaders, looks up attribute and uniform locations
    meshProgramInfo = webglUtils.createProgramInfo(gl, [vertexshader, fragmetnshader]);

    const extents = getGeometriesExtents(obj.geometries);
    range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    // const radius = m4.length(range) * 1.5;
    // cameraPosition = m4.addVectors(cameraTarget, [
    //     0,
    //     0,
    //     radius,
    // ]);
    // // Set zNear and zFar to something hopefully appropriate
    // // for the size of this object.
    // zNear = radius / 100;
    // zFar = radius * 3;

    requestAnimationFrame(render);

}

function render(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.370, 0.370, 0.370, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];

    let radius = m4.length(range) * currzoom * 0.75
    cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    zNear = radius / 100;
    zFar = radius * 3;
    // Compute the camera's matrix using look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);

    const sharedUniforms = {
        u_lightDirection: m4.normalize([-1, 3, 5]),
        u_view: view,
        u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // compute the world matrix once since all parts
    // are at the same space.
    let u_world = m4.yRotation(angle.y);
    // console.log(u_world)
    let xRot = m4.xRotation(angle.x)

    u_world = m4.multiply(u_world, xRot)
    u_world = m4.translate(u_world, ...objOffset);

    for (const { bufferInfo, material } of parts) {
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
        // calls gl.uniform
        webglUtils.setUniforms(meshProgramInfo, {
            u_world,
            u_diffuse: material.u_diffuse,
        });
        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
}

function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
            const v = positions[i + j];
            min[j] = Math.min(v, min[j]);
            max[j] = Math.max(v, max[j]);
        }
    }
    return { min, max };
}

function getGeometriesExtents(geometries) {
    return geometries.reduce(({ min, max }, { data }) => {
        const minMax = getExtents(data.position);
        return {
            min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
            max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
    }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}