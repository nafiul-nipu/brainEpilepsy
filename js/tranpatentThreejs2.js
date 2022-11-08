var camera, renderer, scene, slider, points, blur, focus, anim_play

function init() {
    camera = new THREE.PerspectiveCamera(1, (window.innerWidth * 1.6) / (window.innerHeight * 1.6), 1, 1000);
    camera.position.set(71, 71, 71);

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor('hsl(0, 0%, 0%)', 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth * 1.6, window.innerHeight * 1.6);
    document.getElementById('container').appendChild(renderer.domElement);
    cursors(renderer.domElement);

    // Controls
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);

    // Lights
    let ambient = new THREE.AmbientLight('hsl(0, 0%, 100%)', 0.25);
    let keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 0.6);
    let fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 60%, 85%)'), 0.6);
    let backLight = new THREE.DirectionalLight('hsl(0, 0%, 100%)', 0.4);

    keyLight.position.set(-1, 0, 1);
    fillLight.position.set(1, 0, 1);
    backLight.position.set(1, 0, -1).normalize();

    // Scene
    scene = new THREE.Scene();
    scene.add(ambient);
    scene.add(keyLight);
    scene.add(fillLight);
    scene.add(backLight);


    // const objLoader = new THREE.OBJLoader();
    // // objLoader.loadMtl('https://r105.threejsfundamentals.org/threejs/resources/models/windmill_2/windmill-fixed.mtl', null, (materials) => {
    // // objLoader.setMaterials(materials);

    // objLoader.load('models/brain.obj', obj => {
    //     obj.scale.set(20, 20, 20);
    //     obj.position.set(-0.001, -0.0905, 0);
    //     scene.add(obj);
    //     render(scene, camera)
    // });

    render(scene, camera)
}

function render() {
    renderer.render(scene, camera);
}