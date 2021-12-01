import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


const HAND_SCALE = 0.4;

function init_scene(canvas) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    camera.position.z = CAMERA_DISTANCE;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(-1, 1, 1);
    camera.add(directionalLight);
    scene.add(camera);
    const controls = MyOrbitControls(camera, canvas);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setClearColor(0xffffff, 1);

    const loader = new GLTFLoader();
    loader.load('img/mano.glb', gltf => {
        console.log(gltf);
        const hand = gltf.scene;
        hand.scale.set(HAND_SCALE, HAND_SCALE, HAND_SCALE);
        hand.rotation.y = -Math.PI/2;
        hand.position.set(0, -HAND_SCALE, 0);
        scene.add(hand);
        const index = scene.getObjectByName('M1');
        index.setRotationFromAxisAngle(new THREE.Vector3(0, 0, -1), Math.PI/2);
    });
    
    requestAnimationFrame(function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    });

}


export function set_hand(canvas, hand) {
    init_scene(canvas);
}


const BOUNCE_BACK_SPEED = 0.3;
const CAMERA_DISTANCE = 3;
const CAMERA_ROLL_AMOUNT = 8;
const MAX_X = 2;
const MAX_Y = 2;

function MyOrbitControls (camera, canvas) {

    let bounce_back = true;
    let startx = 0;
    let starty = 0;

    function normalize_camera() {
        const x = camera.position.x * camera.position.x;
        const y = camera.position.y * camera.position.y;
        const d_z = Math.sqrt(CAMERA_DISTANCE * CAMERA_DISTANCE - x - y);
        camera.position.z = d_z > 0 ? d_z : 0;
        camera.lookAt(0, 0, 0);
    }

    function mouse_move(event) {
        let x = -CAMERA_ROLL_AMOUNT * (event.clientX - startx) / canvas.width;
        let y = CAMERA_ROLL_AMOUNT * (event.clientY - starty) / canvas.height;
        x = x > 0 ? Math.sqrt(x) : -Math.sqrt(-x);
        y = y > 0 ? Math.sqrt(y) : -Math.sqrt(-y);
        camera.position.x = x < MAX_X ? (x > -MAX_X ? x : -MAX_X) : MAX_X;
        camera.position.y = y < MAX_Y ? (y > -MAX_Y ? y : -MAX_Y) : MAX_Y;
        normalize_camera();
    }

    function update() {
        if (!bounce_back) return;
        camera.position.x += (0 - camera.position.x) * BOUNCE_BACK_SPEED;
        camera.position.y += (0 - camera.position.y) * BOUNCE_BACK_SPEED;
        normalize_camera();
    }

    function cancel_drag() {
        bounce_back = true;
        canvas.removeEventListener('mousemove', mouse_move);
    }

    canvas.addEventListener('mousedown', e => {
        bounce_back = false;
        startx = e.clientX;
        starty = e.clientY;
        canvas.addEventListener('mousemove', mouse_move);
    });
    canvas.addEventListener('touchstart', e => {
        bounce_back = false;
        startx = e.touches[0].clientX;
        starty = e.touches[0].clientY;
        canvas.addEventListener('touchmove', mouse_move);
    });

    canvas.addEventListener('mouseup', cancel_drag);
    canvas.addEventListener('mouseleave', cancel_drag);
    canvas.addEventListener('touchend', cancel_drag);
    canvas.addEventListener('touchcancel', cancel_drag);

    return { update }
}
