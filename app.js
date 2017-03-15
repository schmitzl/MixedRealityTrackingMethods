/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;

var animationStep = 0;
var graffitiStep = 520;
var isUsingLocationTracking = false;

// set up Argon
var app = Argon.init();
// set up THREE.  
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
scene.autoUpdate = false;




/*var tramGeoObject = new THREE.Object3D();
//tramGeoObject.add(tramModel);
//tramGeoObject.add(frameModel);
var tramGeoEntity = new Argon.Cesium.Entity({
    name: "TramGeo",
    position: Cartesian3.ZERO,
    orientation: Cesium.Quaternion.IDENTITY
});*/




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
//var stats = new Stats();
//hud.hudElements[0].appendChild(stats.dom);

app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);

// -- LOAD TRAM --
// load tram model

//var tramBaseGeo = new THREE.Mesh(); 
//var tramFrameGeo = new THREE.Mesh();
//var tramModelGeo = new THREE.Object3D();

var tramScene = new THREE.Object3D();

var tramBase = new THREE.Object3D();
var tramFrame = new THREE.Object3D();
var platform = new THREE.Object3D();
var invisibilityContainer = new THREE.Object3D();
var portal = new THREE.Object3D();
var canvas = new THREE.Object3D();
var sky = new THREE.Object3D();
var ground = new THREE.Object3D();
var stadshuset = new THREE.Object3D();

loadTramScene();

//tramModel.add(canvas);
//tramModel.add(sky);

//tramModel.rotation.x = Math.PI / 2;
tramScene.rotation.y = Math.PI;
tramScene.translateX(-1);
/*mFrame.scale.set(1.6, 1.6, 1.6);
tramBase.position.x = -0.3;
tramFrame.position.x = -0.3;*/


var graffitiTramScene = new THREE.Object3D();
var graffitiTramBg = new THREE.Object3D();
var graffitiTram = new THREE.Object3D();
var graffitiMaskingPlane = new THREE.Object3D();


loadgraffitiScene();
graffitiTramScene.scale.set(0.25,0.35,0.25);
//graffitiTramScene.translateZ(0.5);


// create tram geo object
/*var tramGeoObject = new THREE.Object3D();
tramGeoObject.add(tramModelGeo);
var tramGeoEntity = new Argon.Cesium.Entity({
    name: "I am a tram",
    position: Cartesian3.ZERO,
    orientation: Cesium.Quaternion.IDENTITY
});*/


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
                var tramMarkerEntity = app.context.subscribeToEntityById(trackables["markerTram2"].id);
                var graffitiMarkerEntity = app.context.subscribeToEntityById(trackables["banksyBgMarker"].id);
                // create a THREE object to put on the trackable
                var tramMarkerObject = new THREE.Object3D();
                scene.add(tramMarkerObject);
                
                var graffitiMarkerObject = new THREE.Object3D();
                scene.add(graffitiMarkerObject);
                
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the tramMarker target
                    var tramMarkerPose = app.context.getEntityPose(tramMarkerEntity);
                    
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if ( tramMarkerPose.poseStatus & Argon.PoseStatus.KNOWN) {
                        tramMarkerObject.position.copy(tramMarkerPose.position);
                        tramMarkerObject.quaternion.copy(tramMarkerPose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (tramMarkerPose.poseStatus & Argon.PoseStatus.FOUND) {
                        tramMarkerObject.add(tramScene);
                        tramScene.position.z = 0;
                        animationStep = 0;
                    }
                    else if (isUsingLocationTracking || (tramMarkerPose.poseStatus & Argon.PoseStatus.LOST) )  {
                        tramScene.position.z = -1;
                        tramScene.scale.set(0.5,0.5,0.5);
                        userLocation.add(tramScene);
                    }
                    
                    var graffitiMarkerPose = app.context.getEntityPose(graffitiMarkerEntity);
                    
                    if ( graffitiMarkerPose.poseStatus & Argon.PoseStatus.KNOWN) {
                        graffitiMarkerObject.position.copy(graffitiMarkerPose.position);
                        graffitiMarkerObject.quaternion.copy(graffitiMarkerPose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (graffitiMarkerPose.poseStatus & Argon.PoseStatus.FOUND) {
                        graffitiMarkerObject.add(graffitiTramScene);
                        
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
    
    graffitiTram.translateY(0.003);
    graffitiTram.translateX(0.005);
    
    if (graffitiStep > 1080) {
        graffitiStep = 0;
        graffitiTram.position.x = 0;
        graffitiTram.position.y = 0;
        graffitiTram.translateY(-580 * 0.003);
        graffitiTram.translateX(-580 * 0.005);
    }
    
    graffitiStep = graffitiStep + 1;
    
    if(animationStep > 700) {
        tramBase.rotation.y = 199 * 0.00272665;
        tramFrame.rotation.y = 199 * 0.00272665;
        tramBase.position.z = 0;
        tramFrame.position.z = 0;
        tramBase.rotation.y = 0;
        tramFrame.rotation.y = 0;
        tramBase.position.x = 0;
        tramFrame.position.x = 0;
        animationStep = 0;
        
    }
    
    animationStep = animationStep + 1;
    
    tramBase.translateZ(0.01);
    tramFrame.translateZ(0.01);
    

    
    if(animationStep > 300  && animationStep < 500) {
        tramBase.rotation.y = tramBase.rotation.y - 0.00272665;
        tramFrame.rotation.y = tramFrame.rotation.y - 0.00272665;
    }
    
    
    
    
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    } else {
        return;
    }
  /*  
    if(!tramInit) {
         var defaultFrame = app.context.getDefaultReferenceFrame();
        // First, clone the userPose postion, and add 10 to the X
        var tramPos_1 = userPose.position.clone();
        tramPos_1.x += 10;
        // set the value of the tram Entity to this local position, by
        // specifying the frame of reference to our local frame
        tramGeoEntity.position.setValue(tramPos_1, defaultFrame);
        // orient the tram according to the local world frame
        tramGeoEntity.orientation.setValue(Cesium.Quaternion.IDENTITY);
        // now, we want to move the tram's coordinates to the FIXED frame, so
        // the tram doesn't move if the local coordinate system origin changes.
        if (Argon.convertEntityReferenceFrame(tramGeoEntity, frame.time, ReferenceFrame.FIXED)) {
            scene.add(tramGeoObject);
            tramInit = true;
        }
    }
    
    // get the local coordinates of the local tram, and set the THREE object
    var tramPose = app.context.getEntityPose(tramGeoEntity);
    tramGeoObject.position.copy(tramPose.position);
    tramGeoObject.quaternion.copy(tramPose.orientation);
  */  
    
    // udpate our scene matrices
    scene.updateMatrixWorld(false);
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // update the rendering stats
    //stats.update();
    // get the subviews for the current frame
    var subviews = app.view.getSubviews();
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = subviews.length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both subviews if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
   // cssRenderer.setSize(viewport.width, viewport.height);
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
        
       // camera.fov = THREE.Math.radToDeg(frustum.fovy);
        //cssRenderer.setViewport(x, y, width, height, subview.index);
        //cssRenderer.render(scene, camera, subview.index);
        
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

function loadTramScene() {
    
    
    var tramMesh;
    var tramTextureLoader = new THREE.TextureLoader();
    var tramGeometry = new THREE.Geometry();
    
    var tramLoader = new THREE.JSONLoader();
    tramLoader.load('resources/obj/tram/tram.js', function (tramGeometry) {
        var tramMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: tramTextureLoader.load('resources/obj/tram/b_tramBase_Albedo.png')
            //specularMap: tramTextureLoader.load('resources/obj/tram/b_tramBase_Metallic.png'),
            //normalMap: tramTextureLoader.load('resources/obj/tram/b_tramBase_Normal.png'),
            //normalScale: new THREE.Vector2(0.75, 0.75),
            //shininess: 25
        });
        tramMesh = new THREE.Mesh(tramGeometry, tramMaterial);
        //tramMesh.renderOrder = 2;
        // add the model to the tramBase object, not the scene
        tramBase.add(tramMesh);
        tramMesh.renderOrder = 2;
        tramMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
   // tramBaseGeo = tramMesh.clone();
    
    var portalMesh;
    var portalTextureLoader = new THREE.TextureLoader();
    var portalGeometry = new THREE.Geometry();
    var portalLoader = new THREE.JSONLoader();
    portalLoader.load('resources/obj/tram/stoneportal.js', function (portalGeometry) {
        var portalMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: portalTextureLoader.load('resources/obj/tram/bricks.jpg')
            //specularMap: tramTextureLoader.load('resources/obj/tram/b_tramBase_Metallic.png'),
            //normalMap: tramTextureLoader.load('resources/obj/tram/b_tramBase_Normal.png'),
            //normalScale: new THREE.Vector2(0.75, 0.75),
            //shininess: 25
        });
        portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        portalMesh.renderOrder = 0;
        // add the model to the tramBase object, not the scene
        portal.add(portalMesh);
        portalMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    
    var frameMesh;
    var frameTextureLoader = new THREE.TextureLoader();
    var frameGeometry = new THREE.Geometry();

     var frameLoader = new THREE.JSONLoader();
     frameLoader.load('resources/obj/tram/frame.js', function (frameGeometry) {
        var frameMaterial = new THREE.MeshLambertMaterial({color: 0x000000});
        frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        frameMesh.renderOrder = 2;
        // add the model to the tramBase object, not the scene
        tramFrame.add(frameMesh);
        frameMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
   // tramFrameGeo = frameMesh.clone();
    
    
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
        platformMesh.renderOrder = 2;
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
        invisibilityContainerMesh.material.color.set(0x001100);
        invisibilityContainerMesh.material.colorWrite = false;
        invisibilityContainerMesh.renderOrder = 1;
        invisibilityContainer.add(invisibilityContainerMesh);
        invisibilityContainerMesh.scale.set(.4, .4, .4);
    });
    
    /*var canvasMesh;
    var canvasTextureLoader = new THREE.TextureLoader();
    var canvasGeometry = new THREE.Geometry();
    var canvasLoader = new THREE.JSONLoader();
    canvasLoader.load('resources/obj/tram/canvas.js', function (canvasGeometry) {
        var canvasMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: canvasTextureLoader.load('resources/obj/tram/bg.png')
            //normalScale: new THREE.Vector2(0.75, 0.75),
        });
        canvasMesh = new THREE.Mesh(canvasGeometry, canvasMaterial);
        canvasMesh.renderOrder = 2;
        // add the model to the tramBase object, not the scene
        canvas.add(canvasMesh);
        canvasMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });*/
    
    var skyMesh;
    var skyTextureLoader = new THREE.TextureLoader();
    var skyGeometry = new THREE.Geometry();
    var skyLoader = new THREE.JSONLoader();
    skyLoader.load('resources/obj/tram/SkyBox.js', function (skyGeometry) {
        var skyMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: skyTextureLoader.load('resources/obj/tram/BlueSky.jpg')
            //normalScale: new THREE.Vector2(0.75, 0.75),
        });
        skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        skyMesh.material.side = THREE.BackSide;
        skyMesh.renderOrder = 2;
        // add the model to the tramBase object, not the scene
        sky.add(skyMesh);
        skyMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    var groundMesh;
    var groundTextureLoader = new THREE.TextureLoader();
    var groundGeometry = new THREE.Geometry();
    var groundLoader = new THREE.JSONLoader();
    groundLoader.load('resources/obj/tram/ground.js', function (groundGeometry) {
        var groundMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: groundTextureLoader.load('resources/obj/tram/Ground_basecolor.png')
            //normalScale: new THREE.Vector2(0.75, 0.75),
        });
        groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.renderOrder = 2;
        // add the model to the tramBase object, not the scene
        ground.add(groundMesh);
        groundMesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    var stadshusetMesh;
    var stadshusetTextureLoader = new THREE.TextureLoader();
    var stadshusetGeometry = new THREE.Geometry();
  
    var stadshusetLoader = new THREE.JSONLoader();
    stadshusetLoader.load('resources/obj/tram/stadshuset.js', function (stadshusetGeometry) {
        var stadshusetMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: stadshusetTextureLoader.load('resources/obj/tram/stadshuset.png'),
            transparent: true
            //alphaTest: 1
          
        });
        stadshusetMesh = new THREE.Mesh(stadshusetGeometry, stadshusetMaterial);
        stadshusetMesh.renderOrder = 2;
        stadshuset.add(stadshusetMesh);
        stadshusetMesh.scale.set(.4, .4, .4);
    });
    
   // tramScene.add(tramBase);
    //tramScene.add(tramFrame);
    tramScene.add(platform);
    //tramScene.add(invisibilityContainer);
    tramScene.add(portal);
    tramScene.add(sky);
    tramScene.add(ground);
    tramScene.add(stadshuset);
}

function loadgraffitiScene() {
    
    var graffitiBgMesh;
    var graffitiBgTextureLoader = new THREE.TextureLoader();
    var graffitiBgGeometry = new THREE.Geometry();
    
    var graffitiBgLoader = new THREE.JSONLoader();
    graffitiBgLoader.load('resources/obj/tram/banksyTramBg.js', function (graffitiBgGeometry) {
        var graffitiBgMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: graffitiBgTextureLoader.load('resources/obj/tram/banksyTrainBackground.png')
          
        });
        graffitiBgMesh = new THREE.Mesh(graffitiBgGeometry, graffitiBgMaterial);
        graffitiBgMesh.renderOrder = 2;
        graffitiTramBg.add(graffitiBgMesh);
    });
    
    
    
    var graffitiTramMesh;
    var graffitiTramTextureLoader = new THREE.TextureLoader();
    var graffitiTramGeometry = new THREE.Geometry();
  
    var graffitiTramLoader = new THREE.JSONLoader();
    graffitiTramLoader.load('resources/obj/tram/banksyTram.js', function (graffitiTramGeometry) {
        var graffitiTramMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: graffitiTramTextureLoader.load('resources/obj/tram/banksyTrain.png'),
            transparent: true,
            //alphaTest: 1
          
        });
        graffitiTramMesh = new THREE.Mesh(graffitiTramGeometry, graffitiTramMaterial);
        graffitiTramMesh.renderOrder = 2;
        graffitiTram.add(graffitiTramMesh);
    });
    
    var maskingPlaneMesh;
    var maskingPlaneTextureLoader = new THREE.TextureLoader();
    var maskingPlaneGeometry = new THREE.Geometry();
    var maskingPlaneLoader = new THREE.JSONLoader();
    maskingPlaneLoader.load('resources/obj/tram/maskingPlane.js', function(maskingPlaneGeometry){
        var maskingPlaneMaterial = new THREE.MeshPhongMaterial();
        maskingPlaneMesh = new THREE.Mesh(maskingPlaneGeometry, maskingPlaneMaterial);
        maskingPlaneMesh.material.color.set(0x001100);
        maskingPlaneMesh.material.colorWrite = false;
        maskingPlaneMesh.renderOrder = 1;
        graffitiMaskingPlane.add(maskingPlaneMesh);
    });

  //  graffitiTramScene.add(graffitiTramBg);
    graffitiTramScene.add(graffitiTram);
    graffitiTramScene.add(graffitiMaskingPlane);
}