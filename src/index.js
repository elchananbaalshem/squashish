////********************Preperations********************////

import { WEBGL } from 'three/examples/jsm/WebGL.js';
if (!WEBGL.isWebGLAvailable()) {
    var warning = WEBGL.getWebGLErrorMessage();
    document.querySelector('body').appendChild(warning);
}
////***************************************************////

import * as THREE from 'three';

import * as handTrack from 'handtrackjs';

let scene, camera, renderer;

let model, predictions;

let onHandMoveEvent;

let ball, matka, walls;

/** DOM elements */
let video;
let highscores, score, name;
let restartGroup, restartButton, autoRestartCheckbox, autoRestartLabel;
/*************** */

let paused = true;


(async () => {
    const { default: style } = await import('./style.css');
    await loadDOMElenemts();
    await startTracking();
    await initScene();
    await initGameControl();
    document.body.removeChild(
        document.querySelector('.while-loading')
    );
})()



async function loadDOMElenemts() {
    video = document.getElementById('video');

    highscores = document.getElementById('highscores');
    score = document.getElementById('score');
    name = document.getElementById('name');

    restartGroup = document.getElementById('restart-group');

    restartButton = document.getElementById('restart-button');
    restartButton.innerText = "Start";

    autoRestartCheckbox = document.getElementById("auto-restart-checkbox");
    autoRestartLabel = document.querySelector("label[for='auto-restart-checkbox']");
}

async function startTracking() {
    model = await handTrack.load({
        flipHorizontal: true,
        imageScaleFactor: 0.7,
        maxNumBoxes: 1,
        iouThreshold: 0.5,
        scoreThreshold: 0.9,
    });

    const status = await handTrack.startVideo(video);
    if (status) {
        navigator.getUserMedia(
            { video: {} },
            stream => {
                video.srcObject = stream;
                runDetection();
                animate();
            },
            err => console.log(err));
    }
}

async function initScene() {
    let { width: videoWidth, height: videoHeight } = getComputedStyle(video);
    let aspect = parseInt(videoWidth) / parseInt(videoHeight);
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 0, 45);

    // world
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xccccccc);


    // static objects
    createWalls();

    // lights
    createLights();

    // moving objects 
    ball = createBall();
    matka = createMatka();


    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(video.width, video.height);
    renderer.outputEncoding = THREE.sRGBEncoding;

    document.body.appendChild(renderer.domElement);

}

function createWalls() {
    let farWall, rightWall, leftWall, upperWall, lowerWall;
    let farWallGeometry = new THREE.PlaneGeometry(20, 20),
        fourWallsGeometry = new THREE.PlaneGeometry(40, 20);

    let material = new THREE.MeshPhysicalMaterial({ color: 0x444444, side: THREE.FrontSide, transparent: true, opacity: 0.8 });

    // Far Wall
    farWall = new THREE.Mesh(farWallGeometry, material);
    farWall.lookAt(0, 0, 0);

    scene.add(farWall);

    // Right Wall
    rightWall = new THREE.Mesh(fourWallsGeometry, material);

    rightWall.lookAt(-1, 0, 0);
    rightWall.position.x = 10;
    rightWall.position.z = 20;

    scene.add(rightWall);

    // Left Wall
    leftWall = new THREE.Mesh(fourWallsGeometry, material);

    leftWall.lookAt(1, 0, 0);
    leftWall.position.x = -10;
    leftWall.position.z = 20;

    scene.add(leftWall);

    // Upper Wall
    upperWall = new THREE.Mesh(fourWallsGeometry, material);

    upperWall.lookAt(0, -1, 0);
    upperWall.rotateZ(Math.PI / 2);


    upperWall.position.y = 10;
    upperWall.position.z = 20;
    scene.add(upperWall);

    // Lower Wall
    lowerWall = new THREE.Mesh(fourWallsGeometry, material);

    lowerWall.lookAt(0, 1, 0);
    lowerWall.rotateZ(Math.PI / 2);

    lowerWall.position.y = -10;
    lowerWall.position.z = 20;
    scene.add(lowerWall);
}

function createLights() {

    let rectLightUp = new THREE.RectAreaLight(0xff0000, 4, 20, 40);
    rectLightUp.position.set(0, 20, 20);
    rectLightUp.lookAt(0, 0, 20);

    scene.add(rectLightUp);

    let rectLightRight = new THREE.RectAreaLight(0x00ff00, 4, 40, 20);
    rectLightRight.position.set(20, 0, 20);
    rectLightRight.lookAt(0, 0, 20);


    scene.add(rectLightRight);

    let rectLightDown = new THREE.RectAreaLight(0x0000ff, 4, 20, 40);
    rectLightDown.position.set(0, -20, 20);

    rectLightDown.lookAt(0, 0, 20);


    scene.add(rectLightDown);

    let rectLightLeft = new THREE.RectAreaLight(0xffff00, 4, 40, 20);
    rectLightLeft.position.set(-20, 0, 20);

    rectLightLeft.lookAt(0, 0, 20);


    scene.add(rectLightLeft);

}

function createBall() {
    let geometry = new THREE.SphereGeometry(1, 32, 32, undefined, undefined, 0, Math.PI);
    let material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    let ball = new THREE.Mesh(geometry, material);
    ball.position.z = 10;
    ball.position.x = 0;

    ball.radius = ball.geometry.parameters.radius;

    let direction = new THREE.Vector3(Math.random(), Math.random(), 0);
    direction.normalize();
    direction.z = -1;
    ball.direction = direction;

    scene.add(ball);
    return ball;
}

function createMatka() {
    let geometry = new THREE.SphereGeometry(3, 32, 32, undefined, undefined, 0, Math.PI / 2);
    let material = new THREE.MeshBasicMaterial({ color: 0xeeeeee, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });

    let matka = new THREE.Mesh(geometry, material);
    matka.position.z = 30;
    matka.lookAt(0, -1000, 0);

    matka.radius = matka.geometry.parameters.radius;

    scene.add(matka);
    return matka;
}

function onWindowResize() {

    let aspect = video.width / video.height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(video.width, video.height);

}


async function initGameControl() {
    onHandMoveEvent = new CustomEvent('handmove');
    window.addEventListener('handmove', onHandMove);

    document.addEventListener('keydown', e => {
        if (e.key === "Esc" || e.key === "Escape") {
            paused = !paused;
            console.log(e)
        }
    });

    restartButton.addEventListener('click', () => {
        restartButton.innerText = "Try Again";
        autoRestartLabel.style.display = "block";

    }, { once: true });
    restartButton.addEventListener('click', restart);


    window.addEventListener('resize', onWindowResize, false);

    /*** Others game Events: */
    /****  hitOn<>Wall,      */
    /****  hitOnMatka        */

}

function onHandMove() {
    let [x, y] = [predictions[0].bbox[0] + predictions[0].bbox[2] / 2, predictions[0].bbox[1] + predictions[0].bbox[3] / 2];

    const rightWallPosition = 20;
    const lowerWallPosition = -20;

    let newXPosition = (x / (video.width + 2)) * (rightWallPosition) - (rightWallPosition) / 2;
    let newYPosition = (y / (video.height + 2)) * (lowerWallPosition) - (lowerWallPosition) / 2;

    matka.position.x = newXPosition;
    matka.position.y = newYPosition;

}


function runDetection() {
    model.detect(video).then(preds => predictions = preds);
    if (predictions?.length && predictions?.[0].score > 0.95) window.dispatchEvent(onHandMoveEvent);
    requestAnimationFrame(runDetection);
}

function animate() {
    requestAnimationFrame(animate);

    if (paused === true) return;

    updateBallPosition();

    if (isHitOnHorizontalWall()) whenHitOnHorizontalWall();
    else if (isHitOnVerticalWall()) whenHitOnVerticalWall();

    if (isHitOnFarWall()) whenHitFarWall();
    else if (isHitOnMatka()) whenHitOnMatka();
    else if (isMiss()) whenMissed();

    renderer.render(scene, camera);
}

function updateBallPosition() {
    ball.position.x += ball.direction.x;
    ball.position.y += ball.direction.y;
    ball.position.z += ball.direction.z;
}

function isHitOnHorizontalWall() {
    return ball.position.x + ball.radius >= 10 ||
        ball.position.x - ball.radius <= -10;
}

function isHitOnVerticalWall() {
    return ball.position.y + ball.radius >= 10 ||
        ball.position.y - ball.radius <= -10;
}

function isHitOnFarWall() {
    return ball.position.z - ball.radius <= 0;
}

function isHitOnMatka() {
    let distance = ball.position.distanceTo(matka.position);

    return distance <= (ball.radius + matka.radius);
}

function isMiss() {
    return !isHitOnMatka() && ball.position.z > camera.position.z;
}

function whenHitFarWall() {
    ball.direction.z = - ball.direction.z;

}
function whenHitOnMatka() {
    ball.direction.y = (ball.position.y + matka.position.y);
    ball.direction.x = (ball.position.x + matka.position.x);
    ball.direction.z = 0;

    ball.direction.normalize();
    ball.direction.z = 1;

    ball.direction.multiplyScalar(-1);
    score.innerText = +score.innerText + 1;
}
function whenHitOnHorizontalWall() {
    ball.direction.x = -ball.direction.x;
    ball.direction.y = -ball.direction.y;
}
function whenHitOnVerticalWall() {
    ball.direction.x = -ball.direction.x;
    ball.direction.y = -ball.direction.y;
}

function whenMissed() {

    //1. Save last game name and score 
    const lastGame = document.createElement('li');
    const scores = {
        el: highscores.querySelector('.scores'),
        arr: Array.from(highscores.querySelector('.scores').children)
    }

    lastGame.innerHTML = `
    <span>${name.innerText}</span><span class="points">${score.innerText}</class=span>
    `

    scores.arr.push(lastGame);
    scores.arr.sort((x, y) => {
        return (
            Number(x.querySelector('.points').innerText) - Number(y.querySelector('.points').innerText)
        )
    });

    scores.el.innerHTML = '';
    for (let i = 0; i < scores.arr.length; i++) {
        scores.el.appendChild(scores.arr[scores.arr.length - 1 - i]);
    }


    //2. restart, or show restart button
    if (autoRestartCheckbox.checked) {
        restart();
    } else {
        paused = true;
        restartGroup.style.display = "flex";
    }

}

function restart() {
    score.innerText = "0";
    name.innerText = document.getElementById('enter-name-input').value;
    restartGroup.style.display = "none";


    ball.position.x = 0;
    ball.position.y = 0;
    ball.position.z = 10;

    ball.direction.x = Math.random();
    ball.direction.y = Math.sqrt(1 - ball.direction.x ** 2);

    paused = false;
}