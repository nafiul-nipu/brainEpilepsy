twgl.setDefaults({ attribPrefix: "a_" });

const WIDTH = 700;
const HEIGHT = 700;
let canvas = document.getElementById('glcanvas')
canvas.width = WIDTH;
canvas.height = HEIGHT;
let gl = null;
let m4 = null;
let camera = null;
let view = null;
let viewProjection = null;

let objects = null;
let drawObjects = null;

let parts = null;

window.onload = async function () {
    m4 = twgl.m4;
    gl = canvas.getContext("webgl");
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const response = await fetch('models/brain.obj');
    const text = await response.text();
    const obj = parseOBJ(text);

    console.log(obj)

    parts = obj.geometries.map(({ data }) => {
        // let color = data.color
        // data.color = { numComponents: 3, data: color };
        const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);

        return bufferInfo
        // return {
        //     // material: {
        //     //     u_diffuse: [1, 1, 1, 1],
        //     // },
        //     bufferInfo,
        // };
    });

    console.log(parts)

    var shapes = [
        twgl.primitives.createCubeBufferInfo(gl, 2),
        // twgl.primitives.createSphereBufferInfo(gl, 1, 24, 12),
        // twgl.primitives.createPlaneBufferInfo(gl, 2, 2),
        // twgl.primitives.createTruncatedConeBufferInfo(gl, 1, 0, 2, 24, 1),
        // twgl.primitives.createCresentBufferInfo(gl, 1, 1, 0.5, 0.1, 24),
        // twgl.primitives.createCylinderBufferInfo(gl, 1, 2, 24, 2),
        // twgl.primitives.createDiscBufferInfo(gl, 1, 24),
        // twgl.primitives.createTorusBufferInfo(gl, 1, 0.4, 24, 12),
    ];

    console.log(shapes)

    // Shared values
    var lightWorldPosition = [1, 8, -10];
    var lightColor = [1, 1, 1, 0.2];
    camera = m4.identity();
    view = m4.identity();
    viewProjection = m4.identity();

    var tex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: [
            255, 255, 255, 255, 192, 192, 192, 255, 192, 192, 192, 255, 255, 255,
            255, 255,
        ],
    });

    objects = [];
    drawObjects = [];
    // var numObjects = 100;
    var baseHue = rand(0, 360);
    // for (var ii = 0; ii < numObjects; ++ii) {
    var uniforms = {
        u_lightWorldPos: lightWorldPosition,
        u_lightColor: lightColor,
        u_diffuseMult: [rand(0.5, 1), rand(0.5, 1), rand(0.5, 1), 0.5],
        u_diffuse: tex,
        u_viewInverse: camera,
        u_world: m4.identity(),
        u_worldInverseTranspose: m4.identity(),
        u_worldViewProjection: m4.identity(),
    };
    drawObjects.push({
        programInfo: programInfo,
        bufferInfo: parts[0],
        uniforms: uniforms,
    });
    objects.push({
        translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
        ySpeed: rand(0.1, 0.3),
        zSpeed: rand(0.1, 0.3),
        uniforms: uniforms,
    });
    // }

    requestAnimationFrame(render);


}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function render(time) {
    time *= 0.0001;
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projection = m4.perspective(
        (30 * Math.PI) / 180,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.5,
        100
    );
    var eye = [1, 4, -20];
    var target = [0, 0, 0];
    var up = [0, 1, 0];

    m4.lookAt(eye, target, up, camera);
    m4.inverse(camera, view);
    m4.multiply(projection, view, viewProjection);

    objects.forEach(function (obj) {
        var uni = obj.uniforms;
        var world = uni.u_world;
        m4.identity(world);
        m4.rotateY(world, time * obj.ySpeed, world);
        m4.rotateZ(world, time * obj.zSpeed, world);
        m4.translate(world, obj.translation, world);
        m4.rotateX(world, time, world);
        m4.transpose(
            m4.inverse(world, uni.u_worldInverseTranspose),
            uni.u_worldInverseTranspose
        );
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
    });

    twgl.drawObjectList(gl, drawObjects);

    requestAnimationFrame(render);
}
