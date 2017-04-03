/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;

var graffiti_step = 1;
var portal_step = 2;
var tram_step = 3;

var step = 1;

var isPlacing = true;

var isInitialized = false;
var isBtnClicked = false;

var animationStep = 0;
var graffitiStep = 520;

var app = Argon.init();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
scene.autoUpdate = false;

document.getElementById("instructions-graffiti-find").style.display = "inline";


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

app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);

// -- LOAD SCENES --
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
tramScene.rotation.y = Math.PI;
tramScene.translateX(-1);

var graffitiTramScene = new THREE.Object3D();
var graffitiTramBg = new THREE.Object3D();
var graffitiTram = new THREE.Object3D();
var graffitiMaskingPlane = new THREE.Object3D();
loadgraffitiScene();
graffitiTramScene.scale.set(0.25, 0.35, 0.25);

var schedule = new THREE.Object3D();
var schedulePost = new THREE.Object3D();
var scheduleBox = new THREE.Object3D();
loadSchedule();


// connect to Vuforia
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeARAAnQsBOSqFf5ai4CvUef5QZPSTsSHEEvvVZyrBPsxT\nmRTTcJ2su54XScbTQfWpMSPAIm7DyWLs3Vf3/GrnTnqHNiX5UmUG5gnzJAaO\nHkh2pCXz0IFO6nW10CtajvKQIZHwWLLbxaVfaCH5pQn26wXG7l97dC1oR+bE\nksjs68KQ7oYpabBhUFhMNtIC7EG0T6Hx4z6id5ojXJMHl90AbJeRUthUx3lf\njZKGr/LzeqnnzVcefRQ5IWJ/FcSROFM8WKdHWd3AZoZswlsyU7NB73daa7hw\nzrMT2tznIZmjrDoKQtxbXFoh/d87Alxz4MNkFnl8ECkUiEK6lmMq4qnxURdo\nxGbZqi03tmP7w7Xrf52R5ChyMY6YgO2h5tof6nUjhgFlgcVCqHLANHzoTy5B\n82Cav7X7L5VWKP/qTI89Zlkn75AVAmHQWslG6ToqSVnOWGswYEbyDlA8KYYV\nP+ppYxHg9JVtcvrME9y1hbqy9bpTSu8HKbaHOeiO7KwbGUuFV+7daOnuxB+V\njhhjFhrEgLhsCGzGT4VRR1xStdYb7wUKQOUE5jRNGat2pi2TQSpRKkjPzN5o\ncJm4pPv3gab//sni/0YZ5Nx2Uqp1A+pBFDf9Ap/8BNw+pLo0iCAsTyX3cvtl\n56UKotmUvMlsKZ8zv0eQNueP5e05uFieOnhUDd6Ip5bBwU4DAGn1enGTza0Q\nCADI/+B8/Sces7b+qpWaGE6irQfFoN2XaO6yWLpnh1j5eTFQWvohu8NnNHXa\nKiT09jSFbyvs8GN+4yDY2pkNgqpp35jmu+xOu3aiyv7OJSVhdNESmfnxNJ0Q\noXAZPxq/nzJHa2fLPkDHRLDIhue2ZliXPGUxWRLHUYrG7q7KOJ0pbVShB9f9\nD2ZKoH8GIBEINCEq8iaT3WVokw9tN7pOl3DjECxkrZR8SgWyinZNyeTDfh/y\nhU8MOZXwZxaua+oYMOvQ+e/xfpJfbHzXjkPdM6IipQZPalnTIB2OZtSsHhus\nYMl0SmhwbW/ckfy7hoC1kznc7bOt6+OyL1sQbfxTGKMVCACyP8Y2MGq4elca\nnCtqVKQ1A4+nuN4tF1dk4M9fFMfMhnibcQ8SwJkRdkN2I8QPIpeIVmwd6QZW\nL8brmAZo9gVZber/ZB4Q8yUUSGj3lju1jStoItu+P3SLQswhkGsbpxFxBXlJ\nnEBAQtgdyoSKAQRmRVN/QEF+rXM9f3+dL2ofiaeumGzrEhJwqILbO0i4zV9Y\n97mfvgmAufew/eb05dY8vwb8jRSGXa8fypXh3mm6aDK3aZcptvzeBVM5iST8\nC/hxvz+G99+jscFbnkm1jY2B9MxPVFy5F9z7ocGKKrRkZww4colzCi4zgZSI\nm8C23H6KITKNlWxiJe2GheCAMiZswcFMA47tt+RhMWHyARAAnYt+AqxzQlk4\nMMjP+FBntdxx/ZLBYjUCehp65fWtAUHSK4unN0rcdDdgTLpq4c94Rp22lvMc\noBnWqgpE/mNEwFa5xO7FRrpbPLq5eJ3gtc0WyEhcFPZZFFeUWeo+yRr6/fx3\nn5rjsedq/eo+XNq9VH7AtjGpjI+F8b5EsrV3ogjEbagcCuSjQV7eCzjay8xw\n9/IhlTQ5gklRBWbV4cQMg6XJYMWWXY2vQnNFfdc81eRatHFiS7d+753TWbQ1\n4zmwpWMgMhXSSQ2/zcxtlPZlP8RGKx2PJVaVmi7ogzSoP6+PLmCwEE0Q66x4\n9Fo+NzB6JFvlMC+ji7nmGzUlANlCMZYMBIPEXH/7rZQ5bmBpqyInTzxAmKYE\nU1tyfVahPPABeEPHnIfrvsQnWhCQfyBtn19pLY6IjnV9hbtkC2WtKw7yZKT+\n+vaer+d8xhs30HkfszWKK8zSSrU+H8vT1Dn8IbHvgzH9sGS76kBtTvseJWbv\npzwO8zuWa3q/YqOcfUsQ//t2U0Rxgxf3Bl4wWCPTDHUWXz8umvf6oTASANHP\nJSRUTFNol0m1W+8C0W53UW922CdO04+OtC+5vDrhaougwMF60RptyyOok8tI\nfdWc36sqPHmiw8xgMSHPcdpSKX6uLzWfkoihaMfpchB4JkjCPTIennOvJPtX\nRlMafepg6u/SwTkBt3k33VvE6Wto5Vqm/b7M8s3jB9dINgAMyU3q1NhnkIsp\no6or8bvTtFKCuoOprXwmqpzj4A5UI1IhR6eXZuv/Z7zPZuguE8rVjChvFVSI\nM3N3Vt/gZcFh96Bbn/xWCU3eKcJVhsEKNZAe8HrOa3ublwleIk190sULxsCl\nJb1KI0TOXswz98Vc8TzKClto9Nq7UNg0slJAS624lh6Uy5a9a5nJX2HbcExz\nhi9h/tV2XVsIG4zWP/76Rq+ueLlH5scmU6/G4FWy8SikUe32/0ZH3XAhun08\n9feUinPwqRSQNQQWpeMlPmIcS+8KgYLCBdRoEWK7brX4ztYsrfqD2HXIekJQ\nvkM2DYeqe4dFYUeHVXAnmQ/39qDsdUgA4L9CbQyfhDxN7blewU/Nna+Pk86Q\nb51IMmc6Xud8oroVbLBUdHWRCCM81rO7dtA65N3G0GF+Jc/9thump51btmE3\n6a1UDRp94wkeAGS2yuFGCvz2XiJfI4wMVvt5Lchal6Bg5BrbquCkOSUP1cGm\nYyVwBTB6AMY3mtUpTyQEaeQPHCtmr3JCPz+5R0VVw+AL89HdA49c+zinQG2w\n3bedsJcVk9yGZ2tRhTgzC9OQ6xXlCYpD/glMbS/p+ksTxOKFqUwjMvAr/FjF\nu8KMj3f32U1ejmJ1rZwXs6N/81I2\n=yMHO\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        api.objectTracker.createDataSet("resources/datasets/ARStockholm.xml").then(function (dataSet) {
            dataSet.load().then(function () {
                var trackables = dataSet.getTrackables();

                var tramMarkerEntity = app.context.subscribeToEntityById(trackables["markerTram2"].id);
                var tramMarkerObject = new THREE.Object3D();
                scene.add(tramMarkerObject);
                
                var graffitiMarkerEntity = app.context.subscribeToEntityById(trackables["banksyBgMarker"].id);
                var graffitiMarkerObject = new THREE.Object3D();
                scene.add(graffitiMarkerObject);
                
                var markerEntity = app.context.subscribeToEntityById(trackables["marker3"].id);
                var markerObject = new THREE.Object3D();
                scene.add(markerObject);
                
                app.context.updateEvent.addEventListener(function () {
                    
                if(step == portal_step) {

                        scene.remove(graffitiMarkerObject);
                    
                        var tramMarkerPose = app.context.getEntityPose(tramMarkerEntity);
                        if ( tramMarkerPose.poseStatus & Argon.PoseStatus.KNOWN) {
                            tramMarkerObject.position.copy(tramMarkerPose.position);
                            tramMarkerObject.quaternion.copy(tramMarkerPose.orientation);
                        }
                        if (tramMarkerPose.poseStatus & Argon.PoseStatus.FOUND) {
                            document.getElementById("heading").innerHTML = "Move the tram";
                            document.getElementById("slider").style.display = "inline";
                            document.getElementById("timeportal-slider").style.display = "inline";
                            document.getElementById("instructions-timeportal-move").style.display = "inline";
                            tramMarkerObject.add(tramScene);
                            tramScene.position.z = 0;
                            animationStep = 0;
                        }
                    
                        if(isPlacing) {
                            if(isBtnClicked) {
                                isBtnClicked = false;
                                isPlacing = false;
                                document.getElementById("slider").style.display = "none";
                                document.getElementById("timeportal-slider").style.display = "none";
                                document.getElementById("heading").innerHTML = "Take a screenshot";
                                document.getElementById("instructions-timeportal-screenshot").style.display = "inline";
                            }
                        } else {
                            if(isBtnClicked) {
                                isBtnClicked = false;
                                step++;
                                isPlacing = true;
                                document.getElementById("thumb").src="resources/imgs/tram_thumb.jpg";
                                document.getElementById("doneBtn").style.display = "none";
                                document.getElementById("heading").innerHTML = "Find the marker";
                                 document.getElementById("instructions-schedule-find").style.display = "inline";
                            }
                        }
                } else if (step == graffiti_step) {
                    
                       
                    
                        var graffitiMarkerPose = app.context.getEntityPose(graffitiMarkerEntity);
                        if ( graffitiMarkerPose.poseStatus & Argon.PoseStatus.KNOWN) {
                            graffitiMarkerObject.position.copy(graffitiMarkerPose.position);
                            graffitiMarkerObject.quaternion.copy(graffitiMarkerPose.orientation);
                        }
                        if (graffitiMarkerPose.poseStatus & Argon.PoseStatus.FOUND) {
                            document.getElementById("heading").innerHTML = "Move the tram";
                            document.getElementById("slider").style.display = "inline";
                            document.getElementById("graffiti-slider").style.display = "inline";
                            document.getElementById("instructions-graffiti-move").style.display = "inline";
                            graffitiMarkerObject.add(graffitiTramScene); 
                        }
                    
                        if(isPlacing) {
                            if(isBtnClicked) {
                                isBtnClicked = false;
                                isPlacing = false;
                                document.getElementById("slider").style.display = "none";
                                document.getElementById("graffiti-slider").style.display = "none";
                                document.getElementById("heading").innerHTML = "Take a screenshot";
                                document.getElementById("instructions-graffiti-screenshot").style.display = "inline";
                            }
                        } else {
                            if(isBtnClicked) {
                                isBtnClicked = false;
                                step++;
                                isPlacing = true;
                                document.getElementById("thumb").src="resources/imgs/portal_thumb.jpg";
                                document.getElementById("doneBtn").style.display = "none";
                                document.getElementById("heading").innerHTML = "Find the marker";
                                document.getElementById("instructions-timeportal-find").style.display = "inline";
                            }
                        }
                } else {
                    
                        scene.remove(tramMarkerObject);    
                    
                        var markerPose = app.context.getEntityPose(markerEntity);
                        if ( markerPose.poseStatus & Argon.PoseStatus.KNOWN) {
                            markerObject.position.copy(markerPose.position);
                            markerObject.quaternion.copy(markerPose.orientation);
                        }
                        if (markerPose.poseStatus & Argon.PoseStatus.FOUND) {
                             //document.getElementById("thumb").src="";
                            // document.getElementById("heading").innerHTML="You found all markers";
                            document.getElementById("heading").innerHTML = "Rotate to Line 5";
                            document.getElementById("doneBtn").style.display = "inline";
                            document.getElementById("slider").style.display = "inline";
                            document.getElementById("schedule-slider").style.display = "inline";
                            document.getElementById("instructions-schedule-move").style.display = "inline";
                            markerObject.add(schedule); 
                        }
                    
                        if(isPlacing) {
                            if(isBtnClicked) {
                                isBtnClicked = false;
                                isPlacing = false;
                                document.getElementById("slider").style.display = "none";
                                document.getElementById("heading").innerHTML = "Take a screenshot";
                                document.getElementById("instructions-schedule-screenshot").style.display = "inline";
                            }
                        } else {
                            if(isBtnClicked) {
                                isBtnClicked = false;
                                step++;
                                isPlacing = true;
                                scene.remove(markerObject);
                                document.getElementById("doneBtn").style.display = "none";
                                document.getElementById("heading").innerHTML = "You are finished";
                            }
                        }
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

app.context.updateEvent.addEventListener(function () {
    
    var graffitiStepVal = document.getElementById('graffiti-slider').value;
    graffitiTram.position.y = graffitiStepVal * 0.003;
    graffitiTram.position.x = graffitiStepVal * 0.005;
    
    var timePortalStepVal = document.getElementById('timeportal-slider').value;
    tramBase.position.z = timePortalStepVal * 0.01;
    tramFrame.position.z = timePortalStepVal * 0.01;
    
    var rotationVal = document.getElementById('schedule-slider').value;
    scheduleBox.rotation.y = rotationVal * 0.01745329252;
    
  /*  graffitiTram.translateY(0.003);
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
    if(animationStep > 300  && animationStep < 500) {
        tramBase.rotation.y = tramBase.rotation.y - 0.00272665;
        tramFrame.rotation.y = tramFrame.rotation.y - 0.00272665;
    }
    
    tramBase.translateZ(0.01);
    tramFrame.translateZ(0.01);*/
    
    var userPose = app.context.getEntityPose(app.context.user);
 
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    } else {
        return;
    }
    
    // udpate our scene matrices
    scene.updateMatrixWorld(false);
});

app.renderEvent.addEventListener(function () {
    var subviews = app.view.getSubviews();
    var monoMode = subviews.length == 1;
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    for (var _i = 0, subviews_1 = subviews; _i < subviews_1.length; _i++) {
        var subview = subviews_1[_i];
      
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
      
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        var _a = subview.viewport, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        
        renderer.setViewport(x, y, width, height);
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
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
        });
        tramMesh = new THREE.Mesh(tramGeometry, tramMaterial);
        tramBase.add(tramMesh);
        tramMesh.renderOrder = 2;
        tramMesh.scale.set(.4, .4, .4);
    });
        
    var portalMesh;
    var portalTextureLoader = new THREE.TextureLoader();
    var portalGeometry = new THREE.Geometry();
    var portalLoader = new THREE.JSONLoader();
    portalLoader.load('resources/obj/tram/stoneportal.js', function (portalGeometry) {
        var portalMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: portalTextureLoader.load('resources/obj/tram/bricks.jpg')
        });
        portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        portalMesh.renderOrder = 0;
        portal.add(portalMesh);
        portalMesh.scale.set(.4, .4, .4);
    });
    
    
    var frameMesh;
    var frameTextureLoader = new THREE.TextureLoader();
    var frameGeometry = new THREE.Geometry();
    var frameLoader = new THREE.JSONLoader();
    frameLoader.load('resources/obj/tram/frame.js', function (frameGeometry) {
        var frameMaterial = new THREE.MeshLambertMaterial({color: 0x000000});
        frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        frameMesh.renderOrder = 2;
        tramFrame.add(frameMesh);
        frameMesh.scale.set(.4, .4, .4);
    });
    
    var platformMesh;
    var platformTextureLoader = new THREE.TextureLoader();
    var platformGeometry = new THREE.Geometry();
    var platformLoader = new THREE.JSONLoader();
    platformLoader.load('resources/obj/tram/platform.js', function (platformGeometry) {
        var platformMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: platformTextureLoader.load('resources/obj/tram/platformTexture.png')
        });
        platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.renderOrder = 2;
        platform.add(platformMesh);
        platformMesh.scale.set(.4, .4, .4);
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
    
    var skyMesh;
    var skyTextureLoader = new THREE.TextureLoader();
    var skyGeometry = new THREE.Geometry();
    var skyLoader = new THREE.JSONLoader();
    skyLoader.load('resources/obj/tram/SkyBox.js', function (skyGeometry) {
        var skyMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: skyTextureLoader.load('resources/obj/tram/BlueSky.jpg')
        });
        skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        skyMesh.material.side = THREE.BackSide;
        skyMesh.renderOrder = 2;
        sky.add(skyMesh);
        skyMesh.scale.set(.4, .4, .4);
    });
    
    var groundMesh;
    var groundTextureLoader = new THREE.TextureLoader();
    var groundGeometry = new THREE.Geometry();
    var groundLoader = new THREE.JSONLoader();
    groundLoader.load('resources/obj/tram/ground.js', function (groundGeometry) {
        var groundMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: groundTextureLoader.load('resources/obj/tram/Ground_basecolor.png')
        });
        groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.renderOrder = 2;
        ground.add(groundMesh);
        groundMesh.scale.set(.4, .4, .4);
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
        });
        stadshusetMesh = new THREE.Mesh(stadshusetGeometry, stadshusetMaterial);
        stadshusetMesh.renderOrder = 2;
        stadshuset.add(stadshusetMesh);
        stadshusetMesh.scale.set(.4, .4, .4);
    });
    
    tramScene.add(tramBase);
    tramScene.add(tramFrame);
    tramScene.add(platform);
    tramScene.add(invisibilityContainer);
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
            transparent: true          
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


function loadSchedule() {
    var schedulePostMesh;
    var schedulePostTextureLoader = new THREE.TextureLoader();
    var schedulePostGeometry = new THREE.Geometry();
    var schedulePostLoader = new THREE.JSONLoader();
    schedulePostLoader.load('resources/obj/tram/SchedulePost.js', function (schedulePostGeometry) {
        var schedulePostMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: schedulePostTextureLoader.load('resources/obj/tram/post.jpg')
        });
        schedulePostMesh = new THREE.Mesh(schedulePostGeometry, schedulePostMaterial);
        schedulePost.add(schedulePostMesh);
    });
    
    var scheduleBoxMesh;
    var scheduleBoxTextureLoader = new THREE.TextureLoader();
    var scheduleBoxGeometry = new THREE.Geometry();
    var scheduleBoxLoader = new THREE.JSONLoader();
    scheduleBoxLoader.load('resources/obj/tram/ScheduleBox.js', function (scheduleBoxGeometry) {
        var scheduleBoxMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: scheduleBoxTextureLoader.load('resources/obj/tram/box.png')
        });
        scheduleBoxMesh = new THREE.Mesh(scheduleBoxGeometry, scheduleBoxMaterial);
        scheduleBox.add(scheduleBoxMesh);
    });
    
    schedule.add(schedulePost);
    schedule.add(scheduleBox);
}

function btnClicked() {
    isBtnClicked = true;
    document.getElementById("doneBtn").style.display = "none";
}