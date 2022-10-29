let gl = null;
let canvas = null;
const WIDTH = 570;
const HEIGHT = 570;
canvas = document.getElementById('glcanvas')

let camera = null;
const center = vec3.set(vec3.create(), 0.5, 0.5, 0.5);
let zFar;
let zNear;
let cameraPosition;
let cameraTarget;
let meshProgramInfo;
let objOffset;
let parts;

var angle = {
    x: 0,
    y: 0,
}

var mouse = {
    lastX: -1,
    lastY: -1,
}

var currzoom = 0;

var dragging = false

function mousedown(event) {
    console.log('here')
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
    console.log('mouse moving')
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
    currZoom += evt.deltaY * -0.02;
    currZoom = Math.min(Math.max(1, currZoom), 100);
}

window.onload = async function () {
    console.log("window on load");

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
    const obj = parseOBJ(text);

    parts = obj.geometries.map(({ data }) => {
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
        if (data.color) {
            if (data.position.length === data.color.length) {
                // it's 3. The our helper library assumes 4 so we need
                // to tell it there are only 3.
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            // there are no vertex colors so just use constant white
            data.color = { value: [1, 1, 1, 1] };
        }

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

    console.log(parts)

    // compiles and links the shaders, looks up attribute and uniform locations
    meshProgramInfo = webglUtils.createProgramInfo(gl, [vertexshader, fragmetnshader]);

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    const radius = m4.length(range) * 1.2;
    cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    zNear = radius / 100;
    zFar = radius * 3;

    requestAnimationFrame(render);

}

function render(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
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