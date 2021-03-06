/* 2021-12-01 Antonio F. G. Sevilla <afgs@ucm.es>
 * Licensed under the Open Software License version 3.0
 *
 * 3D hand module for showing hand configuration and orientation.
 * Part of the VisSE project: https://www.ucm.es/visse
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


const HAND_SCALE = 0.5;
const CAMERA_DISTANCE = 4;
const CAMERA_HEIGHT = 0.75;

let model = null;

export async function init_scene(canvas) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 1, 1000);
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(-1, 1, 1);
    camera.add(directionalLight);
    scene.add(camera);
    const controls = MyOrbitControls(canvas);
    scene.add(controls.root);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setClearColor(0xffffff, 1);

    if (!model) model = load_hand('assets/mano.glb');

    requestAnimationFrame(function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    });

    controls.root.add(await model);
}


const BOUNCE_BACK_SPEED = 0.2;
const CAMERA_ROLL_AMOUNT = 2;

function MyOrbitControls (canvas) {

    const root = new THREE.Object3D();

    let bounce_back = true;
    let startx = 0;
    let starty = 0;

    function mouse_move(event) {
        const ex = event.clientX || event.touches[0].clientX;
        const ey = event.clientY || event.touches[0].clientY;
        const x = CAMERA_ROLL_AMOUNT * (ex - startx) / canvas.width;
        const y = CAMERA_ROLL_AMOUNT * (ey - starty) / canvas.height;
        root.rotation.set(y, x, 0);
    }

    function update() {
        if (!bounce_back) return;
        root.rotation.x += (0 - root.rotation.x) * BOUNCE_BACK_SPEED;
        root.rotation.y += (0 - root.rotation.y) * BOUNCE_BACK_SPEED;
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

    return { root, update }
}

export async function set_hand({ ori, rot, ref, fingers }) {
    const hand = await model;
    const left = ((ref && ori.endsWith('w')) || (!ref && ori.endsWith('b')));
    hand.scale.set(left?-1:1, 1, 1);
    set_hand_orientation(hand, ori, rot, ref);
    set_hand_shape(fingers);
}

function set_hand_orientation(hand, ori, rot, ref) {
    hand.rotation.set(0, 0, 0);
    let rot_axis;
    if (ori == 'w') {
        rot_axis = new THREE.Vector3(0, 0, 1);
    } else if (ori == 'b') {
        hand.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI);
        rot_axis = new THREE.Vector3(0, 0, 1);
    } else if (ori == 'h' && ref) {
        hand.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.5*Math.PI);
        rot_axis = new THREE.Vector3(0, 0, 1);
    } else if (ori == 'h') {
        hand.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -0.5*Math.PI);
        rot_axis = new THREE.Vector3(0, 0, 1);
    } else if (ori == 'hw') {
        hand.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.5*Math.PI);
        rot_axis = new THREE.Vector3(0, 1, 0);
    } else if (ori == 'hb') {
        hand.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), 0.5*Math.PI);
        hand.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI);
        rot_axis = new THREE.Vector3(0, 1, 0);
    } else if (ref) { // hh ref
        hand.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.5*Math.PI);
        hand.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.5*Math.PI);
        rot_axis = new THREE.Vector3(0, 1, 0);
    } else { // hh
        hand.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -0.5*Math.PI);
        hand.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0.5*Math.PI);
        rot_axis = new THREE.Vector3(0, 1, 0);
    }
    hand.rotateOnWorldAxis(rot_axis, -rot*0.25*Math.PI);
}

const actions = {}; // Finger actions

function set_hand_shape([ P, I, C, A, M ]) {
    actions.mixer.stopAllAction();
    actions['P'][P].play();
    actions['I'][I].reset().play();
    actions['C'][C].reset().play();
    actions['A'][A].reset().play();
    actions['M'][M].reset().play();
    actions.mixer.update();
}

function load_hand (gltf_model) {
    const root = new THREE.Object3D();
    return new Promise((resolve, reject) => {
        (new GLTFLoader()).load(gltf_model, gltf => {

            const hand = gltf.scene;
            hand.scale.set(HAND_SCALE, HAND_SCALE, HAND_SCALE);
            hand.rotation.y = -Math.PI/2;
            hand.position.set(0, -HAND_SCALE, 0);
            root.add(hand);

            const mixer = new THREE.AnimationMixer(hand);
            const anim = gltf.animations[0];

            function extract_clip (f, name, kf) {
                const clip = THREE.AnimationUtils.subclip(anim, `${f}_${name}`, kf, kf+1, 1);
                clip.tracks = clip.tracks.filter(t => t.name.startsWith(f));
                return clip;
            }

            ['P', 'I', 'C', 'A', 'M'].forEach(f => {
                actions[f] = {
                    'E': mixer.clipAction(extract_clip(f, 'E', 0)),
                    'E-': mixer.clipAction(extract_clip(f, 'E-', 1)),
                    '': mixer.clipAction(extract_clip(f, 'c', 2)),
                    '-': mixer.clipAction(extract_clip(f, 'c-', 3)),
                    '+': mixer.clipAction(extract_clip(f, 'c+', 4)),
                    'r': mixer.clipAction(extract_clip(f, 'r', 5)),
                    'r+': mixer.clipAction(extract_clip(f, 'r+', 6)),
                    'g': mixer.clipAction(extract_clip(f, 'g', 7)),
                    'g+': mixer.clipAction(extract_clip(f, 'g+', 8)),
                    'c': mixer.clipAction(extract_clip(f, '++', 9)),
                    'x': mixer.clipAction(extract_clip(f, 'x', 10)),
                    's': mixer.clipAction(extract_clip(f, 's', 11)),
                    't': mixer.clipAction(extract_clip(f, 's', 12)),
                    'f': mixer.clipAction(extract_clip(f, 'f', 13)),
                };
            });

            actions.mixer = mixer;

            resolve(root);
        });
    });
}
