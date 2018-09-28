//モデルの位置
const posX = 0;
const posY = 0;
const posZ = 1.5;
//モデルのサイズ
const scale = 2;

//黒枠の幅（ジェネレータのPatternRatioと合わせる）
const patternRatio = 0.9;
//マーカーを検出するフレームレート
const maxDetectionRate = 30;

const getURLParam = (name, url) => {
	if(!url){ url = window.location.href; }

	name = name.replace(/[\[\]]/g, "\\$&");
	let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);

	if(!results){ return null; }
	if(!results[2]){ return ''; }

	return decodeURIComponent(results[2].replace(/\+/g, " "));
}
//GETのstandに1が指定されているならQRに対して垂直に立たせる
//e.g. https://hogehoge?stand=1
const stand = (getURLParam("stand") == 1) ? true : false; 

let renderer, scene, camera;
let arToolkitSource, arToolkitContext;
let markerGroup, markerScene;
let smoothedControls;
let mixer;

const clock = new THREE.Clock();
const stats = new Stats();
document.body.appendChild(stats.dom);
const loading = document.getElementById("loading");

//THREEのレンダラの初期化
const initRenderer = async () => {
	//z-fighting対策でlogarithmicDepthBufferを指定
	renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, logarithmicDepthBuffer: true });
	renderer.gammaOutput = true;
	renderer.setClearColor(new THREE.Color(0xffffff), 0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.top = "0px";
	renderer.domElement.style.left = "0px";
	document.body.appendChild(renderer.domElement);
}
//THREEのシーンの初期化
const initScene = async () => {
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1000, 10000);
	scene.add(camera);

	const light = new THREE.AmbientLight(0xffffff, 1.0);
	scene.add(light);

	const artoolkitProfile = new THREEx.ArToolkitProfile();
	artoolkitProfile.sourceWebcam();

	arToolkitSource = new THREEx.ArToolkitSource(artoolkitProfile.sourceParameters);
	arToolkitSource.init(onReady = () => { resize() });

	artoolkitProfile.contextParameters.patternRatio = patternRatio;
	artoolkitProfile.contextParameters.cameraParametersUrl = "assets/camera_para.dat";
	//artoolkitProfile.contextParameters.detectionMode = "color_and_matrix";
	artoolkitProfile.contextParameters.maxDetectionRate = maxDetectionRate;

	arToolkitContext = new THREEx.ArToolkitContext(artoolkitProfile.contextParameters);
	arToolkitContext.init(onCompleted = () => {
		camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
	});

	window.onresize = resize;
	resize();

	markerGroup = new THREE.Group();
	scene.add(markerGroup);

	const markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerGroup, {
		type : "pattern",
		patternUrl : "assets/marker.patt",
	});

	const smoothedGroup = new THREE.Group();
	scene.add(smoothedGroup);

	smoothedControls = new THREEx.ArSmoothedControls(smoothedGroup);

	markerScene = new THREE.Scene();
	smoothedGroup.add(markerScene);

	//VRMモデルの読み込み
	const result = await loadModel();

	return result;
}

//ブラウザのリサイズ時の処理
const resize = () => {
	arToolkitSource.onResizeElement();
	arToolkitSource.copyElementSizeTo(renderer.domElement);
	if(arToolkitContext.arController !== null){
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
	}
}

//VRMモデルの読み込み
const loadModel = async () => {
	//vrmファイルの読み込み
	const vrmLoader = new THREE.VRMLoader();
	const result = await new Promise(resolve => {
		vrmLoader.load("assets/VRoid.vrm", (vrm) => {
			vrm.scene.position.x = posX;
			vrm.scene.position.y = posY;
			vrm.scene.position.z = posZ;
			vrm.scene.scale.x = scale;
			vrm.scene.scale.y = scale;
			vrm.scene.scale.z = scale;
			vrm.scene.rotation.x = 0.0;
			vrm.scene.rotation.y = Math.PI;
			vrm.scene.rotation.z = 0.0;
			if(!stand){ vrm.scene.rotation.x = -Math.PI / 2.0; }

			markerScene.add(vrm.scene);

			// VRMLoader doesn't support VRM Unlit extension yet so
			// converting all materials to MeshBasicMaterial here as workaround so far.
			vrm.scene.traverse((object) => {
				if(!object.material){ return; }

				if(Array.isArray(object.material)){
					for(let i = 0, il = object.material.length; i < il; i ++){
						const material = new THREE.MeshBasicMaterial();
						THREE.Material.prototype.copy.call(material, object.material[i]);
						material.color.copy(object.material[i].color);
						material.map = object.material[i].map;
						material.lights = false;
						material.skinning = object.material[i].skinning;
						material.morphTargets = object.material[i].morphTargets;
						material.morphNormals = object.material[i].morphNormals;
						object.material[i] = material;
					}
				}else{
					const material = new THREE.MeshBasicMaterial();
					THREE.Material.prototype.copy.call(material, object.material);
					material.color.copy(object.material.color);
					material.map = object.material.map;
					material.lights = false;
					material.skinning = object.material.skinning;
					material.morphTargets = object.material.morphTargets;
					material.morphNormals = object.material.morphNormals;
					object.material = material;
				}
			});

			mixer = new THREE.AnimationMixer(vrm.scene);

			//別のgltfからモーションを借用。本来は不要な処理
			//http://examples.claygl.xyz/examples/basicModelAnimation.html
			const boneLoader = new THREE.GLTFLoader();
			boneLoader.load("assets/SambaDancing.gltf", function(bone){
				const animations = bone.animations;
				if(animations && animations.length){
					for(let animation of animations){
						correctBoneName(animation.tracks);
						correctCoordinate(animation.tracks);
						mixer.clipAction(animation).play();
					}
				}
			});

			return resolve(vrm.scene);
		});
	});

	return result;
}

//Mixamo用からVRoid用にボーン名を変更
//bvhなども同様にボーン名を変更すればモーションを反映できる
const correctBoneName = (tracks) => {
	const positions = new Map([
		["mixamorigHips", "J_Bip_C_Hips"],
	]);
	const quaternions = new Map([
		["mixamorigHips",             "J_Bip_C_Hips"],
		["mixamorigSpine",            "J_Bip_C_Spine"],
		["mixamorigSpine1",           "J_Bip_C_Chest"],
		["mixamorigSpine2",           "J_Bip_C_UpperChest"],
		["mixamorigNeck",             "J_Bip_C_Neck"],
		["mixamorigHead",             "J_Bip_C_Head"],
		["mixamorigRightUpLeg",       "J_Bip_R_UpperLeg"],	["mixamorigLeftUpLeg",       "J_Bip_L_UpperLeg"],
		["mixamorigRightLeg",         "J_Bip_R_LowerLeg"],	["mixamorigLeftLeg",         "J_Bip_L_LowerLeg"],
		["mixamorigRightFoot",        "J_Bip_R_Foot"],		["mixamorigLeftFoot",        "J_Bip_L_Foot"],
		["mixamorigRightToeBase",     "J_Bip_R_ToeBase"],	["mixamorigLeftToeBase",     "J_Bip_L_ToeBase"],
		["mixamorigRightShoulder",    "J_Bip_R_Shoulder"],	["mixamorigLeftShoulder",    "J_Bip_L_Shoulder"],
		["mixamorigRightArm",         "J_Bip_R_UpperArm"],	["mixamorigLeftArm",         "J_Bip_L_UpperArm"],
		["mixamorigRightForeArm",     "J_Bip_R_LowerArm"],	["mixamorigLeftForeArm",     "J_Bip_L_LowerArm"],
		["mixamorigRightHand",        "J_Bip_R_Hand"],		["mixamorigLeftHand",        "J_Bip_L_Hand"],
		["mixamorigRightHandMiddle1", "J_Bip_R_Middle1"],	["mixamorigLeftHandMiddle1", "J_Bip_L_Middle1"],
		["mixamorigRightHandMiddle2", "J_Bip_R_Middle2"],	["mixamorigLeftHandMiddle2", "J_Bip_L_Middle2"],
		["mixamorigRightHandMiddle3", "J_Bip_R_Middle3"],	["mixamorigLeftHandMiddle3", "J_Bip_L_Middle3"],
		["mixamorigRightHandIndex1",  "J_Bip_R_Index1"],	["mixamorigLeftHandIndex1",  "J_Bip_L_Index1"],
		["mixamorigRightHandIndex2",  "J_Bip_R_Index2"],	["mixamorigLeftHandIndex2",  "J_Bip_L_Index2"],
		["mixamorigRightHandIndex3",  "J_Bip_R_Index3"],	["mixamorigLeftHandIndex3",  "J_Bip_L_Index3"],
		["mixamorigRightHandPinky1",  "J_Bip_R_Little1"],	["mixamorigLeftHandPinky1",  "J_Bip_L_Little1"],
		["mixamorigRightHandPinky2",  "J_Bip_R_Little2"],	["mixamorigLeftHandPinky2",  "J_Bip_L_Little2"],
		["mixamorigRightHandPinky3",  "J_Bip_R_Little3"],	["mixamorigLeftHandPinky3",  "J_Bip_L_Little3"],
		["mixamorigRightHandThumb1",  "J_Bip_R_Thumb1"],	["mixamorigLeftHandThumb1",  "J_Bip_L_Thumb1"],
		["mixamorigRightHandThumb2",  "J_Bip_R_Thumb2"],	["mixamorigLeftHandThumb2",  "J_Bip_L_Thumb2"],
		["mixamorigRightHandThumb3",  "J_Bip_R_Thumb3"],	["mixamorigLeftHandThumb3",  "J_Bip_L_Thumb3"],
		["mixamorigRightHandRing1",   "J_Bip_R_Ring1"],		["mixamorigLeftHandRing1",   "J_Bip_L_Ring1"],
		["mixamorigRightHandRing2",   "J_Bip_R_Ring2"],		["mixamorigLeftHandRing2",   "J_Bip_L_Ring2"],
		["mixamorigRightHandRing3",   "J_Bip_R_Ring3"],		["mixamorigLeftHandRing3",   "J_Bip_L_Ring3"],
	]);

	for(const [key, value] of positions){
		tracks.find((obj) => { return obj.name === `${key}.position`; }).name = `${value}.position`;
	}
	for(const [key, value] of quaternions){
		tracks.find((obj) => { return obj.name === `${key}.quaternion`; }).name = `${value}.quaternion`;
	}
}
//Mixamo用からVRoid用にトラックの値を変更
const correctCoordinate = (tracks) => {
	for(let track of tracks){
		//const track = tracks[j];
		const index = track.name.indexOf(".");
		const ext = track.name.slice(index + 1);
		if(ext == "quaternion"){
			for(let k = 0; k < track.values.length; k+=4){
				track.values[k + 1] = -track.values[k + 1];
				track.values[k + 3] = -track.values[k + 3];
			}
		}else if(ext == "position"){
			for(let k = 0; k < track.values.length; k+=3){
				track.values[k] *= -0.01;
				track.values[k + 1] *= 0.01;
				track.values[k + 2] *= -0.01;
			}
		}
	}
}

//初期化処理
const init = async () => {
	let resRenderer = initRenderer();
	let resScene = initScene();

	//レンダラ、シーンの初期化が済んでいるか
	await Promise.all([resRenderer, resScene]);
	loading.style.display = "none";

	//更新処理の開始
	requestAnimationFrame(update);
}

//更新処理
const update = async () => {
	requestAnimationFrame(update);

	if(arToolkitSource.ready === false){ return; }
	arToolkitContext.update(arToolkitSource.domElement);

	smoothedControls.update(markerGroup);

	let delta = clock.getDelta();
	if(mixer){ mixer.update(delta); }

	renderer.render(scene, camera);
	stats.update();
}

//初期化処理の開始
init();
