/// <reference types="@argonjs/argon" />
/// <reference types="three" />
// grab some handles on APIs we use
/*var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;
// set up Argon
var app = Argon.init();

// ser local coordinate system 
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
 
// set up THREE
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);

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

// We put some elements in the index.html, for convenience. 
// Here, we retrieve them and move the information boxes to the 
// the CSS3DArgonHUD hudElement.
var hudContent = document.getElementById('hud');
hud.appendChild(hudContent);
var arrowContainer = document.getElementById('arrowContainer');
hudContent.appendChild(arrowContainer);
var arrow = document.getElementById('arrow');
//  We also move the description box to the Argon HUD, but moving it inside the 'hud' element
//var hudDescription = document.getElementById('description');
arrowContainer.appendChild(arrow);
// All geospatial objects need to have an Object3D linked to a Cesium Entity.
// We need to do this because Argon needs a mapping between Entities and Object3Ds.


// -- LOAD GEO TRAM --
// load tram model
var tramModel = new THREE.Object3D();
var frameModel = new THREE.Object3D();
loadTram();


// create tram geo object
var tramGeoObject = new THREE.Object3D();
tramGeoObject.add(tramModel);
tramGeoObject.add(frameModel);
var tramGeoEntity = new Argon.Cesium.Entity({
    name: "I have a box",
    position: Cartesian3.ZERO,
    orientation: Cesium.Quaternion.IDENTITY
});

// Create DIV for arrow images
/* var arrowElem = document.getElementById("arrow");
var arrow = new THREE.CSS3DSprite(arrowElem);
arrow.scale.set(0.02,0.02,0.02);
arrow.position.set(0,1.25,0); */


// Create a DIV to use to label the position and distance of the tram
/*
var tramLocDiv = document.getElementById("box-location");
var tramLabel = new THREE.CSS3DSprite(tramLocDiv);
tramLabel.scale.set(0.02, 0.02, 0.02);
tramLabel.position.set(0, 1.25, 0);
tramGeoObject.add(tramLabel);
var tramInit = false;
var tramCartographicDeg = [0, 0, 0];
var lastTramText = '';




// -- LOAD VUFORIA TRAM --


    
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nAbpgIff/////AAAAGZQMcI4Z7kIIly3Z1UGsKaAocd3l/8m0ESOk7IPPwje5qxNTEAxj/ou7imDB18KyywDyGC2JcjBJl2NZzx+fvPBtAhME919bYrZd9mdl3A9WZrwGckVA9kLYPE3MqoXB3gv98ELez7QEWREW0C2rGM2P5FFWdqY2FRieJm6h3GHDlvN++MPpzyzna0839EEdFxeQRV0YSDMViZcOgANVY1B+dwfKIzTXellyiwQG3z1SLKPu4ua/1+adhRtn+TNk8qOZSgXdGSzpr6wn4A9/1NnTadcsQi1axt/1VPPDWxDelyqF3u+My4RLSl/B5SWMPB9z63PgGHAeVDexillU/9E9elqrHYp+ZUBXQZi8LIPM\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        //
// the vuforia API is ready, so we can start using it.
//
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
        var tramObjectEntity = app.context.subscribeToEntityById(trackables["tram"].id);
        // create a THREE object to put on the trackable
        var tramIconObject = new THREE.Object3D;
        scene.add(tramIconObject);
        // the updateEvent is called each time the 3D world should be
        // rendered, before the renderEvent.  The state of your application
        // should be updated here.
        app.context.updateEvent.addEventListener(function () {
            // get the pose (in local coordinates) of the tramObject target
            var tramObjectPose = app.context.getEntityPose(tramObjectEntity);
            // if the pose is known the target is visible, so set the
            // THREE object to the location and orientation
            if (tramObjectPose.poseStatus & Argon.PoseStatus.KNOWN) {
                tramIconObject.position.copy(tramObjectPose.position);
                tramIconObject.quaternion.copy(tramObjectPose.orientation);
            }
            // when the target is first seen after not being seen, the 
            // status is FOUND.  Here, we move the 3D text object from the
            // world to the target.
            // when the target is first lost after being seen, the status 
            // is LOST.  Here, we move the 3D text object back to the world
            if (tramObjectPose.poseStatus & Argon.PoseStatus.FOUND) {
                tramIconObject.add(tramModel);
                tramModel.position.z = 0;
            }
            else if (tramObjectPose.poseStatus & Argon.PoseStatus.LOST) {
                tramModel.position.z = -0.5;
                userLocation.add(argonTextObject);
            } 
        });
    }).catch(function (err) {
        console.log("could not load dataset: " + err.message);
    });
    // activate the dataset.
    api.objectTracker.activateDataSet(dataSet);
});
    
    }).catch(function (err) {
        console.log("vuforia failed to initialize: " + err.message);
    });
});
    



    







// make floating point output a little less ugly
function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}


app.updateEvent.addEventListener(function (frame) { // called before every render event
    // get the position and orientation (the 'pose') of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
    else {
        return;
    }
    // the first time through, we create a geospatial position for
    if (!tramInit) {
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
            scene.add(new THREE.AmbientLight(0x443333));
            var light = new THREE.DirectionalLight(0xffddcc, 1);
            light.position.set(1, 0.75, 0.5);
            scene.add(light);
            var light = new THREE.DirectionalLight(0xccccff, 1);
            light.position.set(-1, 0.75, -0.5);
            scene.add(light);
            tramInit = true;
        }
    }
    // get the local coordinates of the local tram, and set the THREE object
    var tramPose = app.context.getEntityPose(tramGeoEntity);
    tramGeoObject.position.copy(tramPose.position);
    tramGeoObject.quaternion.copy(tramPose.orientation);

    // It's fairly expensive to convert FIXED coordinates back to LLA, 
    // but those coordinates probably make the most sense as
    // something to show the user, so we'll do that computation.
    // cartographicDegrees is a 3 element array containing 
    // [longitude, latitude, height]
    var gpsCartographicDeg = [0, 0, 0];
    // get user position in global coordinates
    var userPoseFIXED = app.context.getEntityPose(app.context.user, ReferenceFrame.FIXED);
    var userLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(userPoseFIXED.position);
    if (userLLA) {
        gpsCartographicDeg = [
            CesiumMath.toDegrees(userLLA.longitude),
            CesiumMath.toDegrees(userLLA.latitude),
            userLLA.height
        ];
    }
    var tramPoseFIXED = app.context.getEntityPose(tramGeoEntity, ReferenceFrame.FIXED);
    var tramLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(tramPoseFIXED.position);
    if (tramLLA) {
        tramCartographicDeg = [
            CesiumMath.toDegrees(tramLLA.longitude),
            CesiumMath.toDegrees(tramLLA.latitude),
            tramLLA.height
        ];
    }
    // Calculate euclidean distance to tram
    // use Cesium.EllipsoidGeodesic if object is further away
    var userPos = userLocation.getWorldPosition();
    var tramPos = tramModel.getWorldPosition();
    var distanceToTram = userPos.distanceTo(tramPos);
    // create some feedback text
   /* var infoText = 'Geospatial Argon example:<br>';
    infoText += 'Your location is lla (' + toFixed(gpsCartographicDeg[0], 6) + ', ';
    infoText += toFixed(gpsCartographicDeg[1], 6) + ', ' + toFixed(gpsCartographicDeg[2], 2) + ')';
    infoText += 'tram is ' + toFixed(distanceToTram, 2) + ' meters away'; */ /*
    var tramLabelText = 'A tram!<br>lla = ' + toFixed(tramCartographicDeg[0], 6) + ', ';
    tramLabelText += toFixed(tramCartographicDeg[1], 6) + ', ' + toFixed(tramCartographicDeg[2], 2);

    if (lastTramText !== tramLabelText) {
        tramLocDiv.innerHTML = tramLabelText;
        lastTramText = tramLabelText;
    }
});

// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // set the renderers to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    cssRenderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode    
    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        var frustum = subview.frustum;
        // set the position and orientation of the camera for 
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera. 
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        // set the CSS rendering up, by computing the FOV, and render this view
        camera.fov = THREE.Math.radToDeg(frustum.fovy);
        cssRenderer.setViewport(x, y, width, height, subview.index);
        cssRenderer.render(scene, camera, subview.index);
        // set the webGL rendering parameters and render this view
        renderer.setViewport(x, y, width, height);
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        // adjust the hud
        hud.setViewport(x, y, width, height, subview.index);
        hud.render(subview.index);
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
        // add the model to the tramModel object, not the scene
        tramModel.add(tramMesh);
      //  mesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
    
    
    var frameMesh;
    var frameTextureLoader = new THREE.TextureLoader();
    var frameGeometry = new THREE.Geometry();

     var frameLoader = new THREE.JSONLoader();
     frameLoader.load('resources/obj/tram/frame.js', function (frameGeometry) {
        var frameMaterial = new THREE.MeshLambertMaterial({color: 0x000000});
        frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        // add the model to the tramModel object, not the scene
        frameModel.add(frameMesh);
      //  mesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
}*/

/*function cameraToClosestObjectPos() {
    // get user postion
    var userPose = app.context.getEntityPose(app.context.user);
    
    // get camera rotation 
    var cameraRotation = camera.rotation.y;
    
    // calculate rotation vector
    var quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), cameraRotation);

    var gazeVector =  userPose;
    gazeVector.applyQuaternion( quaternion );
    
    // get object position
    
    // 
}*/