/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon
var app = Argon.init();
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
scene.autoUpdate = false;
// We use the standard WebGLRenderer when we only need WebGL-based content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
// to easily control stuff on the display
var hud = new THREE.CSS3DArgonHUD();
// We put some elements in the index.html, for convenience. 
// Here, we retrieve the description box and move it to the 
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById('description');
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);
// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild(stats.dom);
// Tell argon what local coordinate system you want.  The default coordinate
// frame used by Argon is Cesium's FIXED frame, which is centered at the center
// of the earth and oriented with the earth's axes.  
// The FIXED frame is inconvenient for a number of reasons: the numbers used are
// large and cause issues with rendering, and the orientation of the user's "local
// view of the world" is different that the FIXED orientation (my perception of "up"
// does not correspond to one of the FIXED axes).  
// Therefore, Argon uses a local coordinate frame that sits on a plane tangent to 
// the earth near the user's current location.  This frame automatically changes if the
// user moves more than a few kilometers.
// The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
// that here.  The other option Argon supports is localOriginEastNorthUp, which is
// more similar to what is used in the geospatial industry
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
// create a bit of animated 3D text that says "argon.js" to display 
var uniforms = {
    amplitude: { type: "f", value: 0.0 }
};
var argonTextObject = new THREE.Object3D();
argonTextObject.position.z = -0.5;
userLocation.add(argonTextObject);
var loader = new THREE.FontLoader();
loader.load('resources/fonts/helvetiker_bold.typeface.js', function (font) {
    var textGeometry = new THREE.TextGeometry("argon.js", {
        font: font,
        size: 40,
        height: 5,
        curveSegments: 3,
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });
    textGeometry.center();
    var tessellateModifier = new THREE.TessellateModifier(8);
    for (var i = 0; i < 6; i++) {
        tessellateModifier.modify(textGeometry);
    }
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(textGeometry);
    var numFaces = textGeometry.faces.length;
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
    var colors = new Float32Array(numFaces * 3 * 3);
    var displacement = new Float32Array(numFaces * 3 * 3);
    var color = new THREE.Color();
    for (var f = 0; f < numFaces; f++) {
        var index = 9 * f;
        var h = 0.07 + 0.1 * Math.random();
        var s = 0.5 + 0.5 * Math.random();
        var l = 0.6 + 0.4 * Math.random();
        color.setHSL(h, s, l);
        var d = 5 + 20 * (0.5 - Math.random());
        for (var i = 0; i < 3; i++) {
            colors[index + (3 * i)] = color.r;
            colors[index + (3 * i) + 1] = color.g;
            colors[index + (3 * i) + 2] = color.b;
            displacement[index + (3 * i)] = d;
            displacement[index + (3 * i) + 1] = d;
            displacement[index + (3 * i) + 2] = d;
        }
    }
    bufferGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    bufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: "\n            uniform float amplitude;\n            attribute vec3 customColor;\n            attribute vec3 displacement;\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                vNormal = normal;\n                vColor = customColor;\n                vec3 newPosition = position + normal * amplitude * displacement;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n            }\n        ",
        fragmentShader: "\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                const float ambient = 0.4;\n                vec3 light = vec3( 1.0 );\n                light = normalize( light );\n                float directional = max( dot( vNormal, light ), 0.0 );\n                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );\n            }\n        "
    });
    var textMesh = new THREE.Mesh(bufferGeometry, shaderMaterial);
    argonTextObject.add(textMesh);
    argonTextObject.scale.set(0.001, 0.001, 0.001);
    argonTextObject.position.z = -0.50;
    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(function () {
        uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
    });
});
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nu8KMj3f32U1ejmJ1rZwXs6N/81I2\n=yMHO\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here 
        api.objectTracker.createDataSet("resources/datasets/ARStockholm.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.  
            dataSet.load().then(function () {
                // when it is loaded, we retrieve a list of trackables defined in the
                // dataset and set up the content for the target
                var trackables = dataSet.getTrackables();
                // tell argon we want to track a specific trackable.  Each trackable
                // has a Cesium entity associated with it, and is expressed in a 
                // coordinate frame relative to the camera.  Because they are Cesium
                // entities, we can ask for their pose in any coordinate frame we know
                // about.
                var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["tram"].id);
                // create a THREE object to put on the trackable
                var gvuBrochureObject = new THREE.Object3D;
                scene.add(gvuBrochureObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                        gvuBrochureObject.position.copy(gvuBrochurePose.position);
                        gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                        gvuBrochureObject.add(argonTextObject);
                        argonTextObject.position.z = 0;
                    }
                    else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        argonTextObject.position.z = -0.50;
                        userLocation.add(argonTextObject);
                    }
                });
            })["catch"](function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });
    })["catch"](function (err) {
        console.log("vuforia failed to initialize: " + err.message);
    });
});
// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
    // udpate our scene matrices
    scene.updateMatrixWorld(false);
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // update the rendering stats
    stats.update();
    // get the subviews for the current frame
    var subviews = app.view.getSubviews();
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = subviews.length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both subviews if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode    
    for (var _i = 0, subviews_1 = subviews; _i < subviews_1.length; _i++) {
        var subview = subviews_1[_i];
        // set the position and orientation of the camera for 
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera. 
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this subview
        var _a = subview.viewport, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        renderer.setViewport(x, y, width, height);
        // set the webGL rendering parameters and render this view
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
});

