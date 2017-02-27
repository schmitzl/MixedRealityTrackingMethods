/// <reference types="@argonjs/argon" />
/// <reference types="three" />
// grab some handles on APIs we use
var Cesium = Argon.Cesium;
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
var arrow = hudContent.getElementById('arrow');
//  We also move the description box to the Argon HUD, but moving it inside the 'hud' element
//var hudDescription = document.getElementById('description');
hudContent.appendChild(arrow);
// All geospatial objects need to have an Object3D linked to a Cesium Entity.
// We need to do this because Argon needs a mapping between Entities and Object3Ds.


// initialize model loading variables
var mesh;
var textureLoader = new THREE.TextureLoader();
var geometry = new THREE.Geometry();

// load tram model
var tramModel = new THREE.Object3D();
loadTram();


// create tram geo object
var tramGeoObject = new THREE.Object3D();
tramGeoObject.add(tramModel);
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
var tramLocDiv = document.getElementById("box-location");
var tramLabel = new THREE.CSS3DSprite(tramLocDiv);
tramLabel.scale.set(0.02, 0.02, 0.02);
tramLabel.position.set(0, 1.25, 0);
tramGeoObject.add(tramLabel);
var tramInit = false;
var tramCartographicDeg = [0, 0, 0];
var lastTramText = '';

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
    // rotate the tram at a constant speed, independent of frame rates     
    // to make it a little less boring
    // stuff to print out the status message.
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
    infoText += 'tram is ' + toFixed(distanceToTram, 2) + ' meters away'; */
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
    var loader = new THREE.JSONLoader();
    loader.load('resources/obj/tram/tram.js', function (geometry) {
        var material = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: textureLoader.load('resources/obj/tram/b_tramBase_Albedo.png'),
            specularMap: textureLoader.load('resources/obj/tram/b_tramBase_Metallic.png'),
            normalMap: textureLoader.load('resources/obj/tram/b_tramBase_Normal.png'),
            //normalScale: new THREE.Vector2(0.75, 0.75),
            shininess: 25
        });
        mesh = new THREE.Mesh(geometry, material);
        // add the model to the tramModel object, not the scene
        tramModel.add(mesh);
      //  mesh.scale.set(.4, .4, .4);
       // mesh.rotation.x = THREE.Math.degToRad(90);
    });
}
