/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;

// set up Argon
var app = Argon.init();
// set up THREE.  
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
scene.autoUpdate = false;

// add light to the scene
scene.add(new THREE.AmbientLight(0x443333));
var light = new THREE.DirectionalLight(0xffddcc, 1);
light.position.set(1, 0.75, 0.5);
scene.add(light);
var light = new THREE.DirectionalLight(0xccccff, 1);
light.position.set(-1, 0.75, -0.5);
scene.add(light);

// set up renderer
var cssRenderer = new THREE.CSS3DArgonRenderer();
var hud = new THREE.CSS3DArgonHUD(); // place for fixed html screen content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
app.view.element.appendChild(cssRenderer.domElement);
app.view.element.appendChild(hud.domElement);


// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild(stats.dom);

app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);

// -- LOAD GEO TRAM --
// load tram model
var tramModel = new THREE.Object3D();
var tramBase = new THREE.Object3D();
var tramFrame = new THREE.Object3D();
var platform = new THREE.Object3D();
var invisibilityContainer = new THREE.Object3D();
loadTram();
tramModel.add(tramBase);
tramModel.add(tramFrame);
tramModel.add(platform);
tramModel.add(invisibilityContainer);

tramModel.rotation.x = Math.PI / 2;
tramModel.rotation.y = Math.PI;


// connect to Vuforia
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
                var tramMarkerEntity = app.context.subscribeToEntityById(trackables["tram"].id);
                // create a THREE object to put on the trackable
                var tramMarkerObject = new THREE.Object3D();
                scene.add(tramMarkerObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the tramMarker target
                    var tramMarkerPose = app.context.getEntityPose(tramMarkerEntity);
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (tramMarkerPose.poseStatus & Argon.PoseStatus.KNOWN) {
                        tramMarkerObject.position.copy(tramMarkerPose.position);
                        tramMarkerObject.quaternion.copy(tramMarkerPose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (tramMarkerPose.poseStatus & Argon.PoseStatus.FOUND) {
                        tramMarkerObject.add(tramModel);
                        tramModel.position.z = 0;
                    }
                    else if (tramMarkerPose.poseStatus & Argon.PoseStatus.LOST) {
                        tramModel.position.z = -0.50;
                        userLocation.add(tramModel);
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

function loadTram() {
    var tramMesh;
    var tramTextureLoader = new THREE.TextureLoader();
    var tramGeometry = new THREE.Geometry();
    
    var tramLoader = new THREE.JSONLoader();
    tramLoader.load('resources/obj/tram/tram.js', function (tramGeometry) {
        var tramMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: tramTextureLoader.load('resources/obj/tram/b_tramBase_Albedo.png'),
            specularMap: tramTextureLoader.load('resources/obj/tram/b_tramBase_Metallic.png'),
            normalMap: tramTextureLoader.load('resources/obj/tram/b_tramBase_Normal.png'),
            //normalScale: new THREE.Vector2(0.75, 0.75),
            shininess: 25
        });
        tramMesh = new THREE.Mesh(tramGeometry, tramMaterial);
        tramMesh.renderOrder = 0;
        // add the model to the tramBase object, not the scene
        tramBase.add(tramMesh);
        tramMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    
    var frameMesh;
    var frameTextureLoader = new THREE.TextureLoader();
    var frameGeometry = new THREE.Geometry();

     var frameLoader = new THREE.JSONLoader();
     frameLoader.load('resources/obj/tram/frame.js', function (frameGeometry) {
        var frameMaterial = new THREE.MeshLambertMaterial({color: 0x000000});
        frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
         frameMesh.renderOrder = 0;
        // add the model to the tramBase object, not the scene
        tramFrame.add(frameMesh);
        frameMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    
    var platformMesh;
    var platformTextureLoader = new THREE.TextureLoader();
    var platformGeometry = new THREE.Geometry();
    var platformLoader = new THREE.JSONLoader();
    platformLoader.load('resources/obj/tram/platform.js', function (platformGeometry) {
        var platformMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: platformTextureLoader.load('resources/obj/tram/platformTexture.png')
            //normalScale: new THREE.Vector2(0.75, 0.75),
        });
        platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.renderOrder = 0;
        // add the model to the tramBase object, not the scene
        platform.add(platformMesh);
        platformMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    var invisibilityContainerMesh;
    var invisibilityContainerTextureLoader = new THREE.TextureLoader();
    var invisibilityContainerGeometry = new THREE.Geometry();
    var invisibilityContainerLoader = new THREE.JSONLoader();
    invisibilityContainerLoader.load('resources/obj/tram/invisibilityContainer.js', function(invisibilityContainerGeometry){
        var invisibilityContainerMaterial = new THREE.MeshPhongMaterial();
        invisibilityContainerMesh = new THREE.Mesh(invisibilityContainerGeometry, invisibilityContainerMaterial);
        invisibilityContainerMesh.material.color.set(0x000000);
        invisibilityContainerMesh.material.colorWrite = false;
        invisibilityContainerMesh.renderOrder = 2;
        invisibilityContainer.add(invisibilityContainerMesh);
        invisibilityContainerMesh.scale.set(.4, .4, .4);
    });
}
