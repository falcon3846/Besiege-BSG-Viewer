let blockData;
let blockDataList;
let blockDataLoaded = false;

let testBsg;
let loadBsg;

let testObj;
let testTex;

let font;

let colorShader;

let machineLoaded = false;
let blockScale = 10;

let objs = [];
let textures = [];

let shortenedWood;
let shortenedPole;
let shortenedLog;

let cameraBlock;

let middleBrace;
let middleRope;
let middleSpring;
let middleDistMeter;

let endDistMeter;

let glassSurface;

let maskSurface;
let maskBallon;
let maskRocket;

let surfaces = [];

let machineCost = 0;

let rotX = -0.4;
let rotY = 0.6;
let distance = 15*blockScale;

let center = {x:0, y:-5.05*blockScale, z:0};

let prevTouches = [];
let prevTouchCount = 0;

let showPinCam = true;

let showBuildZone = true;

let showCollider = false;
let showMesh = true;

let loadedFiles = 0;
let blockNum = 90;

function preload(){
    blockData = loadXML("blockData.xml",xmlLoaded);

    font = loadFont("NotoSansJP-Regular.ttf");

    colorShader = loadShader("default.vert","changeColor.frag");
   
    testBsg = loadXML("test.bsg", bsgLoaded);
    loadBsg = testBsg;

    testObj = loadModel('assets/0.obj', false);
    testTex = loadImage('assets/0.png');

    for(let n = 0; n < blockNum; n ++){
        try{
            loadModel(
                'assets/'+ n + '.obj',false,
                m => {
                    objs[n] = m;
                    loadedFiles += 1;
                    document.getElementById("value").textContent = 
                    Math.floor(loadedFiles*100/(blockNum*2))+"%";
                },
                err => {
                    console.log("missing",n);
                    objs[n] = testObj;
                }
            );
        }catch(e){
            console.log(e);
        }

        try{
            loadImage(
                'assets/'+ n + '.png',
                img => {
                    textures[n] = img;
                    loadedFiles += 1;
                    document.getElementById("value").textContent = 
                    Math.floor(loadedFiles*100/(blockNum*2))+"%";
                },
                err => {
                    console.log("missing", path);
                    textures[n] = testTex;
                }
            );
        }catch(e){
            console.log(e);
        }
    }

    shortenedWood = loadModel('assets/1s.obj',false);
    shortenedPole = loadModel('assets/41s.obj',false);
    shortenedLog = loadModel('assets/63s.obj',false);

    cameraBlock = loadModel("assets/58_2.obj",false);

    middleBrace = loadModel('assets/7m.obj',false);
    middleSpring = loadModel('assets/9m.obj',false);
    middleRope = loadModel('assets/45m.obj',false);
    middleDistMeter = loadModel('assets/75m.obj',false);

    endDistMeter = loadModel('assets/75_2.obj',false);

    glassSurface = loadImage('assets/73_2.png');

    maskSurface = loadImage('assets/73_c.png');
    maskBallon = loadImage('assets/74_c.png');
    maskRocket = loadImage('assets/59_c.png');
}

function setup(){
    if (windowWidth < 800 || window.devicePixelRatio > 1.5) {
        pixelDensity(1);
        console.log("is smartphone?");
    }
    createCanvas(windowWidth, windowHeight, WEBGL);
    document.getElementById("loading").style.display = "none";
    textFont(font);
    textSize(15);
    textureMode(NORMAL);
    textAlign(CENTER,CENTER);
    let inputButton = createFileInput(handleFile);
    inputButton.position(10, 10).attribute("accept", ".bsg");

    let resetButton = createButton("Reset Camera");
    resetButton.position(10, 50);
    resetButton.mousePressed(resetCamera);

    let pinCamButton = createButton("pin,camera show/hide");
    pinCamButton.position(10, 80);
    pinCamButton.mousePressed(pinCamToggle);

    let buildZoneButton = createButton("build zone show/hide");
    buildZoneButton.position(10, 110);
    buildZoneButton.mousePressed(buildZoneToggle);

    let meshButton = createButton("mesh");
    meshButton.position(10, 140);
    meshButton.mousePressed(meshOn);

    let mixButton = createButton("mix");
    mixButton.position(60, 140);
    mixButton.mousePressed(mixOn);

    let colliderButton = createButton("collider");
    colliderButton.position(98, 140);
    colliderButton.mousePressed(colliderOn);

    document.oncontextmenu = () => false;
}

function pinCamToggle(){
    showPinCam = !showPinCam;
}

function buildZoneToggle(){
    showBuildZone = !showBuildZone;
}

function meshOn(){
    showMesh = true;
    showCollider = false;
}

function mixOn(){
    showMesh = true;
    showCollider = true;
}

function colliderOn(){
    showMesh = false;
    showCollider = true; 
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

function draw(){
    background(190);
    perspective(PI/3, width/height, 0.001, 10000);

    updateCamera();

    if(blockDataLoaded){
        blockDataList = blockData.getChildren("Block");
    }

    if(showBuildZone){//ビルドゾーン
        push();
        rotateZ(Math.PI);
        scale(blockScale);

        translate(0,5.072,0);
        stroke(50);
        strokeWeight(0.1);
        noFill();
        box(18,10.144,18);
        translate(0,-5.072,0);

        stroke(200,50,50);
        strokeWeight(0.8);
        line(-9,0,-9,9,0,-9);

        stroke(50,200,50);
        strokeWeight(0.8);
        line(-9,0,-9,-9,10.144,-9);

        stroke(50,50,200);
        strokeWeight(0.8);
        line(-9,0,-9,-9,0,9);
        
        pop();
    }

    if(machineLoaded){
        try {
            loadMachine(loadBsg);
        } catch(e) {
            console.error(e);
            alert("ファイルが読み込めませんでした");
            loadBsg = testBsg;
        }
    }

    push();
    resetMatrix();
    translate(75-width/2,180-height/2);
    camera(0, 0, (height/2) / tan(PI/6), 0, 0, 0, 0, 1, 0);
    fill(0);
    text("総ブロック数: " + machineCost,0, 0);
    pop();


    // if(frameCount % 30 === 0){
    // console.log(frameRate());
    // }
}

function updateCamera(){
  let x = center.x + distance * cos(rotX) * sin(rotY);
  let y = center.y + distance * sin(rotX);
  let z = center.z + distance * cos(rotX) * cos(rotY);

  camera(x, y, z, center.x, center.y, center.z, 0, 1, 0);
}

// マウス操作
function mouseDragged(){

  if(mouseButton === LEFT){
    rotY -= movedX * 0.01;   
    rotX -= movedY * 0.01;

    rotX = constrain(rotX, -PI/2 + 0.01, PI/2 - 0.01);
  }

  if(mouseButton === RIGHT){
    panCamera(movedX, movedY);
  }
}

function mouseWheel(e){
  distance += e.delta * 0.3;
  distance = max(50, distance);
}

// パン
function panCamera(dx, dy){

  let panSpeed = distance * 0.001;

  // カメラ方向
  let forward = createVector(
    sin(rotY) * cos(rotX),
    sin(rotX),
    cos(rotY) * cos(rotX)
  );

  let worldUp = createVector(0, 1, 0);

  // right, up 計算
  let right = p5.Vector.cross(forward, worldUp).normalize();
  let up = p5.Vector.cross(right, forward).normalize();

  center.x += (dx * panSpeed) * right.x;
  center.y += (dx * panSpeed) * right.y;
  center.z += (dx * panSpeed) * right.z;

  center.x += (-dy * panSpeed) * up.x;
  center.y += (-dy * panSpeed) * up.y;
  center.z += (-dy * panSpeed) * up.z;
}

// タッチ操作
function touchStarted(){
  prevTouches = touches.map(t=>({x:t.x,y:t.y}));
  prevTouchCount = touches.length;
}

function touchMoved(){

  if(touches.length !== prevTouchCount){
    prevTouches = touches.map(t=>({x:t.x,y:t.y}));
    prevTouchCount = touches.length;
    return false;
  }

  // ---- 1本指：回転 ----
  if(touches.length === 1){

    let dx = touches[0].x - prevTouches[0].x;
    let dy = touches[0].y - prevTouches[0].y;

    rotY -= dx * 0.01;   
    rotX -= dy * 0.01;

    rotX = constrain(rotX, -PI/2 + 0.01, PI/2 - 0.01);
  }

  // ---- 2本指：ズーム + パン ----
  if(touches.length === 2){

    let d1 = dist(
      touches[0].x, touches[0].y,
      touches[1].x, touches[1].y
    );

    let d0 = dist(
      prevTouches[0].x, prevTouches[0].y,
      prevTouches[1].x, prevTouches[1].y
    );

    // ズーム（弱め）
    distance += (d0 - d1) * 0.5;
    distance = max(50, distance);

    // 中点移動 → パン
    let midX = (touches[0].x + touches[1].x)/2;
    let midY = (touches[0].y + touches[1].y)/2;

    let pmidX = (prevTouches[0].x + prevTouches[1].x)/2;
    let pmidY = (prevTouches[0].y + prevTouches[1].y)/2;

    panCamera(midX - pmidX, midY - pmidY);
  }

  prevTouches = touches.map(t=>({x:t.x,y:t.y}));
  prevTouchCount = touches.length;

  return false;
}

// リセット
function resetCamera(){
  rotX = -0.4;
  rotY = 0.6;
  distance = 15 * blockScale;

  center = {x:0, y:-5.05*blockScale, z:0};
}


function handleFile(file){
    machineLoaded = false;
    loadBsg = loadXML(file.data, bsgLoaded);
}

function bsgLoaded(){
    machineLoaded = true;
    surfaces = [];
}

function xmlLoaded(){
    blockDataLoaded = true;
}

function loadMachine(bsg){
    machineCost = 0;
    noStroke();
    let global = bsg.getChild("Global");
    let globalPos = global.getChild("Position");
    let globalRot = global.getChild("Rotation");

    let camLines = [];

    push();

    rotateZ(Math.PI);
    scale(blockScale);

    translate(globalPos.getNum("x"),
              globalPos.getNum("y"),
              globalPos.getNum("z"));

    rotateQuaternion(globalRot.getNum("x"),
                     globalRot.getNum("y"),
                     globalRot.getNum("z"),
                     globalRot.getNum("w"));


    let blocks = bsg.getChild("Blocks").getChildren("Block");
    let pinCams = [];
    for(let block of blocks){
        let id = block.getNum("id");

        machineCost += 1;

        if(block.hasAttribute("modId")){//mod
            if(block.hasAttribute("fallback")){
                id = block.getNum("fallback");
            }else{
                continue;
            }
        }

        if(id >= blockNum){

        }else if(id == 73){ //サフェ.
            let scl = block.getChild("Transform").getChild("Scale");
            let surfaceScale = createVector(scl.getNum("x"),
                                            scl.getNum("y"),
                                            scl.getNum("z"));
            let guid = block.getString("guid");
            let found = false;
            for(let surface of surfaces){
                if(surface.guid == guid){
                    found = true;
                    resetShader();
                    if(surface.surfaceModel != null){
                        let inte = block.getChild("Data").getChildren("Integer");
                        for(let i of inte){
                            if(i.getString("key") === "bmt-surfMat"){
                            if(Number(i.getContent()) == 2){
                                texture(glassSurface);
                            }else{
                                let bool = block.getChild("Data").getChildren("Boolean");
                                for(let b of bool){
                                    if(b.getString("key") === "bmt-painted"){
                                        if(b.getContent() === "True"){
                                            let single = block.getChild("Data").getChildren("Single");
                                            let sat = 0;
                                            let lum = 0;
                                            for(let s of single){
                                                if(s.getString("key") === "bmt-sat"){
                                                sat = Number(s.getContent());
                                                }
                                                if(s.getString("key") === "bmt-lum"){
                                                lum = Number(s.getContent());
                                                }
                                            }
                                            let c = block.getChild("Data").getChild("Color");
                                            let surfaceColor = convertRGB(Number(c.getChild("R").getContent()),
                                                                            Number(c.getChild("G").getContent()),
                                                                            Number(c.getChild("B").getContent()),
                                                                            sat,lum);
                                            shader(colorShader);
                                            colorShader.setUniform("tex", textures[id]);
                                            colorShader.setUniform("maskTex", maskSurface);
                                            colorShader.setUniform("strength", 0.8);
                                            colorShader.setUniform("color", [surfaceColor.r,surfaceColor.g,surfaceColor.b]);
                                        }else{
                                            texture(textures[73]);
                                        }
                                    break;
                                    }
                                }
                            }
                            break;
                            }
                        }
                        model(surface.surfaceModel);
                    }
                    break;
                }
            }

            if(!found){
                let single = block.getChild("Data").getChildren("Single");
                let thickness = 0.08;
                for(let s of single){
                    if(s.getString("key") === "bmt-thickness"){
                    thickness = Number(s.getContent());
                    break;
                    }
                }

                let nodes = searchNodes(block,blocks);
                let surface = new Surface(guid,nodes.corns,nodes.mids,thickness,surfaceScale);
                surface.buildSurface();
                surfaces.push(surface);
            }

        }else if(id == 71 || id == 72){//サフェのノード.
            machineCost -= 1;
        }else if(id == 57 || id == 58){//ピン、カメラ.
            pinCams.push(block);
        }else{

        let pos = block.getChild("Transform").getChild("Position");
        let rot = block.getChild("Transform").getChild("Rotation");
        let scl = block.getChild("Transform").getChild("Scale");

        push();

        translate(pos.getNum("x"),
                  pos.getNum("y"),
                  pos.getNum("z"));

        rotateQuaternion(rot.getNum("x"),
                         rot.getNum("y"),
                         rot.getNum("z"),
                         rot.getNum("w"));

        //ペラの反転(F)とスクリューの鏡像.
        if(id == 26 || id == 55 || id == 80){
            let booleans = block.getChild("Data").getChildren("Boolean");
            for(let bool of booleans){
                if(bool.getString("key") === "flipped" && bool.getContent() === "True"){
                    scale(1,-1,1);
                }
                if(bool.getString("key") === "bmt-chirality" && bool.getContent() === "True"){
                    scale(1,-1,1);
                }
            }
        }

        let isPreextended = false;
        if(id == 18 || id == 42){
            let booleans = block.getChild("Data").getChildren("Boolean");
            for(let bool of booleans){
                if(bool.getString("key") === "preextended" && bool.getContent() === "True"){
                    isPreextended = true;
                    break;
                }
            }
        }


        //二点を結ぶブレース等.
        let vec = block.getChild("Data").getChildren("Vector3");
        let braceElement = 0;
        let startPos = createVector(0,0,0);
        let startRot = createVector(0,0,0);
        let endPos = createVector(0,0,0);
        let endRot = createVector(0,0,0);
        for(let v of vec){
            if(v.getString("key") === "start-position"){
                braceElement += 1;
                startPos = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
            if(v.getString("key") === "start-rotation"){
                braceElement += 1;
                startRot = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
            if(v.getString("key") === "end-position"){
                braceElement += 1;
                endPos = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
            if(v.getString("key") === "end-rotation"){
                braceElement += 1;
                endRot = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
        }
        
        scale(scl.getNum("x"),
            scl.getNum("y"),
            scl.getNum("z"));

        if(showMesh){
            resetShader();
            if(id == 59 || id == 74){//色変更
                let strength = 1;
                let mask = textures[id];
                if(id == 59){
                    strength = 0.8;
                    mask = maskRocket;
                }
                if(id == 74){
                    strength = 0.4;
                    mask = maskBallon;
                }        
                let c = block.getChild("Data").getChild("Color");
                shader(colorShader);
                colorShader.setUniform("tex", textures[id]);
                colorShader.setUniform("maskTex", mask);
                colorShader.setUniform("strength", strength);
                colorShader.setUniform("color", [Number(c.getChild("R").getContent()),
                                                Number(c.getChild("G").getContent()),
                                                Number(c.getChild("B").getContent())]);
                        
            }else{
                texture(textures[id]);
            }
        }
        

        if(braceElement == 4){//二点を結ぶブレース等.
            let braceLength = p5.Vector.sub(startPos,endPos).mag();
            if(showMesh){
                push();
                translate(p5.Vector.add(endPos,startPos).div(2));
                rotateToVector(p5.Vector.sub(endPos,startPos));
                scale(1,1,braceLength);
                switch (id) {
                case 7:
                    model(middleBrace);
                    break;
                case 9:
                    model(middleSpring);
                    break;
                case 45:
                    model(middleRope);
                    break;
                case 75:
                    model(middleDistMeter);
                    break;
                }
                pop();
            }
            
            push();
            translate(startPos);

            antiRotateQuaternion(rot.getNum("x"),
                         rot.getNum("y"),
                         rot.getNum("z"),
                         rot.getNum("w"));
            angleMode(DEGREES);
            rotateYXZ(startRot);
            angleMode(RADIANS);
            if(showMesh){
                model(objs[id]);
            }
            
            drawCollider(id,false,false,false);

            pop();

            if(braceLength > 0.0001){
                push();
                translate(endPos);

                antiRotateQuaternion(rot.getNum("x"),
                         rot.getNum("y"),
                         rot.getNum("z"),
                         rot.getNum("w"));
                angleMode(DEGREES);
                rotateYXZ(endRot);
                angleMode(RADIANS);

                if(showMesh){
                    if(id == 75){
                        model(endDistMeter);
                    }else{
                        model(objs[id]);
                    }
                }

                drawCollider(id,true,false,false);
                pop();
            }

        }else{
            
            let modelObj = objs[id];

            let isShort = false;
            if(id == 1 || id == 41 || id == 63){//短縮.
                let inte = block.getChild("Data").getChildren("Integer");
                for(let i of inte){
                    if(i.getString("key") === 'length'){
                        if(id == 1 && Number(i.getContent()) == 1){
                            modelObj = shortenedWood;
                            isShort = true;
                        }
                        if(id == 41 && Number(i.getContent()) == 1){
                            modelObj = shortenedPole;
                            isShort = true;
                        }
                        if(id == 63 && Number(i.getContent()) == 2){
                            modelObj = shortenedLog;
                            isShort = true;
                        }
                    }
                }
            }

            if(showMesh){
                scale(-1,1,1);
                model(modelObj);
                scale(-1,1,1);
            }
            resetShader();
            
            drawCollider(id,false,isPreextended,isShort);

        }

        pop();
        }

    }
    if(showPinCam){
        let gl = this._renderer.GL;
        gl.clear(gl.DEPTH_BUFFER_BIT); 
        for(let pinCam of pinCams){
            let id = pinCam.getNum("id");

            let pos = pinCam.getChild("Transform").getChild("Position");
            let rot = pinCam.getChild("Transform").getChild("Rotation");
            let scl = pinCam.getChild("Transform").getChild("Scale");

            push();

            translate(pos.getNum("x"),
                    pos.getNum("y"),
                    pos.getNum("z"));

            if(id == 58){
                let singles = pinCam.getChild("Data").getChildren("Single");
                let dist = 32;
                let heit = 18;
                let cRot = 0;
                let pitch = 0;
                let roll = 0;
                let yaw = 0;
                for(let s of singles){
                    if(s.getString("key") === "bmt-distance"){
                        dist = Number(s.getContent());
                    }
                    if(s.getString("key") === "bmt-height"){
                        heit = Number(s.getContent());
                    }
                    if(s.getString("key") === "bmt-rotation"){
                        cRot = Number(s.getContent());
                    }
                    if(s.getString("key") === "bmt-pitch"){
                        pitch = Number(s.getContent());
                    }              
                    if(s.getString("key") === "bmt-roll"){
                        roll = Number(s.getContent());
                    }             
                    if(s.getString("key") === "bmt-yaw"){
                        yaw = Number(s.getContent());
                    }             
                }

                push();

                let q = {x:rot.getNum("x"),
                        y:rot.getNum("y"),
                        z:rot.getNum("z"),
                        w:rot.getNum("w")};

                let v = rotateVectorByQuaternion(createVector(0,0,1), q);
                let nv = createVector(v.x,0,v.z);
                if(p5.Vector.equals(nv,createVector()) || abs(v.angleBetween(nv)) >= PI/4){
                    v = rotateVectorByQuaternion(createVector(0,1,0), q);
                }
                v.mult(dist);

                let pv = rotatePitch(v,radians(heit));
                if(abs(pv.x) < 1e-5 && abs(pv.z) < 1e-5){
                    v = rotatePitch(v,radians(heit)*0.999);
                }else{
                    v = pv;
                }
                v = rotatePy(v,radians(cRot));

                let camRot = lookAt(v,createVector(0,1,0));
                rotateQuaternion(camRot.x,camRot.y,camRot.z,camRot.w);

                let lv = p5.Vector.sub(v,p5.Vector.normalize(v));

                camLines.push([pos.getNum("x"),pos.getNum("y"),pos.getNum("z"),
                                pos.getNum("x")+lv.x,pos.getNum("y")+lv.y,pos.getNum("z")+lv.z]);

                translate(0,0,dist);
                
                rotateX(radians(pitch));
                rotateY(radians(-yaw));
                rotateZ(radians(roll));

                scale(scl.getNum("x"),
                    scl.getNum("y"),
                    scl.getNum("z"));
                scale(-1,1,1);
                rotateY(PI);

                texture(textures[id]);
                model(cameraBlock);
                pop();
            }

            rotateQuaternion(rot.getNum("x"),
                            rot.getNum("y"),
                            rot.getNum("z"),
                            rot.getNum("w"));

            scale(scl.getNum("x"),
                scl.getNum("y"),
                scl.getNum("z"));
            scale(-1,1,1);

            texture(textures[id]);
            model(objs[id]);
            
            pop();
        }
    }

    drawCamLine(camLines);

    pop();

    function drawCollider(id,isEnd,isPreextended,isShort){
        if(blockDataLoaded && showCollider){
            for(let xmlBlock of blockDataList){
                if(xmlBlock.getNum("id") == id){
                    push();
                    let colliders = xmlBlock.getChildren("Colliders");
                    for(let collider of colliders){
                        if(collider.getString("type") === "default" 
                            && !(isShort || isPreextended || isEnd)){
                        }else if(collider.getString("type") === "short" && isShort){
                        }else if(collider.getString("type") === "extended" && isPreextended){
                        }else if(collider.getString("type") === "end" && isEnd){
                        }else{
                            continue;
                        }
                        let gameObjs = collider.getChildren("Object");
                        for(let gameObj of gameObjs){
                            push();
                            let oPos = gameObj.getChild("Position");
                            let oRot = gameObj.getChild("Rotation");
                            let oScale = gameObj.getChild("Scale");
                            translate(oPos.getNum("x"),
                                        oPos.getNum("y"),
                                        oPos.getNum("z"));

                            rotateQuaternion(oRot.getNum("x"),
                                            oRot.getNum("y"),
                                            oRot.getNum("z"),
                                            oRot.getNum("w"));
                            scale(oScale.getNum("x"),
                                    oScale.getNum("y"),
                                    oScale.getNum("z"));
                            let boxColliders = gameObj.getChildren("BoxCollider");
                            let sphereColliders = gameObj.getChildren("SphereCollider");
                            let capsuleColliders = gameObj.getChildren("CapsuleCollider");
                            for(let collider of boxColliders){
                                drawBoxCollider(collider);
                            }
                            for(let collider of sphereColliders){
                                drawSphereCollider(collider);
                            }
                            for(let collider of capsuleColliders){
                                drawCapsuleCollider(collider);
                            }
                            pop();
                        }
                    }
                    
                    
                    pop();

                    break;


                }
            }
        }
    }

}

function drawBoxCollider(collider){
    noStroke();
    fill(colliderColor(collider));
    push();
    let center = collider.getChild("Center");
    let size = collider.getChild("Size");
    translate(center.getNum("x"),
            center.getNum("y"),
            center.getNum("z"));
    box(size.getNum("x"),
        size.getNum("y"),
        size.getNum("z"));
    pop();
}
function drawSphereCollider(collider){
    noStroke();
    fill(colliderColor(collider));
    push();
    let center = collider.getChild("Center");
    let radius = collider.getChild("Radius");
    translate(center.getNum("x"),
            center.getNum("y"),
            center.getNum("z"));
    sphere(radius.getNum("r"));
    pop();                        
}
function drawCapsuleCollider(collider){
    noStroke();
    fill(colliderColor(collider));
    push();
    let center = collider.getChild("Center");
    let radius = collider.getChild("Radius");
    let heit = collider.getChild("Height");
    let direction = collider.getChild("Direction");
    translate(center.getNum("x"),
            center.getNum("y"),
            center.getNum("z"));
    capsule(radius.getNum("r"),heit.getNum("h"),direction.getNum("d"));
    pop();                        
}
function capsule(radius,heit,direction){
    let nh = heit-radius*2;
    if(direction == 0){
        rotateZ(PI/2);
    }else if(direction == 2){
        rotateX(PI/2);
    }
    cylinder(radius,nh);
    translate(0,nh/2,0);
    sphere(radius);
    translate(0,-nh,0);
    sphere(radius);
}
function colliderColor(collider){
    let layer = collider.getNum("layer");
    let isTrigger = collider.getString("isTrigger");
    if(layer == 22){
        return "#c8323290";
    }else{
        if(layer == 12 || layer == 14){
            if(isTrigger === "True"){
                return "#68c52290";
            }else{
                return "#59c5ec90";
            }
        }else{
            return "#bf60bf90";
        }
    }
}

class Surface{

    guid = "";
    corns = [];
    mids = [];
    thickness = 0;
    surfaceScale = createVector();

    surfaceModel = new p5.Geometry();

    constructor(guid,corns,mids,thickness,surfaceScale){
        this.guid = guid;
        this.corns = corns;
        this.mids = mids;
        this.thickness = thickness;
        this.surfaceScale = surfaceScale;
    }

    buildSurface(){//ノードからメッシュを作成.
        if(this.corns == null || this.mids == null){
            return null;
        }
        let p00 = this.corns[0];
        let p10 = this.corns[1];
        let p01 = this.corns[2];
        let p11 = this.corns[3];

        let mX0 = this.mids[0];
        let mX1 = this.mids[1];
        let m0Y = this.mids[2];
        let m1Y = this.mids[3];

        let g = new p5.Geometry();
        g.gid = this.guid;

        let detail = 8;
        let delta = 1/detail;

        let pointsF = [];
        let pointsB = [];
        let uvs = [];
        for(let u = 0; u <= 1 + delta/2; u += delta){

                let c0 = this.#curve(u,p00,p10,mX0);
                let c1 = this.#curve(u,p01,p11,mX1);

                let dc0Du = this.#dcurveDt(u,p00,p10,mX0);
                let dc1Du = this.#dcurveDt(u,p01,p11,mX1);

                if(u == 0){//端に微小量追加
                    c0 = this.#curve(0.01*delta,p00,p10,mX0);
                    c1 = this.#curve(0.01*delta,p01,p11,mX1);
                    dc0Du = this.#dcurveDt(0.01*delta,p00,p10,mX0);
                    dc1Du = this.#dcurveDt(0.01*delta,p01,p11,mX1);
                }else if(u <= 1 - delta/2){
                    c0 = this.#curve(u-0.01*delta,p00,p10,mX0);
                    c1 = this.#curve(u-0.01*delta,p01,p11,mX1);
                    dc0Du = this.#dcurveDt(u-0.01*delta,p00,p10,mX0);
                    dc1Du = this.#dcurveDt(u-0.01*delta,p01,p11,mX1);
                }

            for(let v = 0; v <= 1 + delta/2; v += delta){
                let d0 = this.#curve(v,p00,p01,m0Y);
                let d1 = this.#curve(v,p10,p11,m1Y);

                let dD0Dv = this.#dcurveDt(v,p00,p01,m0Y);
                let dD1Dv = this.#dcurveDt(v,p10,p11,m1Y);

                if(v == 0){//端に微小量追加
                    d0 = this.#curve(0.01*delta,p00,p01,m0Y);
                    d1 = this.#curve(0.01*delta,p10,p11,m1Y);
                    dD0Dv = this.#dcurveDt(0.01*delta,p00,p01,m0Y);
                    dD1Dv = this.#dcurveDt(0.01*delta,p10,p11,m1Y);
                }else if(v <= 1 - delta/2){
                    d0 = this.#curve(v-0.01*delta,p00,p01,m0Y);
                    d1 = this.#curve(v-0.01*delta,p10,p11,m1Y);
                    dD0Dv = this.#dcurveDt(v-0.01*delta,p00,p01,m0Y);
                    dD1Dv = this.#dcurveDt(v-0.01*delta,p10,p11,m1Y);
                }

                let lc = p5.Vector.mult(c0,1-v).add(p5.Vector.mult(c1,v));
                let ld = p5.Vector.mult(d0,1-u).add(p5.Vector.mult(d1,u));

                let dlcDu = p5.Vector.mult(dc0Du,1-v).add(p5.Vector.mult(dc1Du,v));
                let dldDu = p5.Vector.mult(d0,-1).add(p5.Vector.mult(d1,1));
                let dlcDv = p5.Vector.mult(c0,-1).add(p5.Vector.mult(c1,1));
                let dldDv = p5.Vector.mult(dD0Dv,1-u).add(p5.Vector.mult(dD1Dv,u));

                let b =      p5.Vector.mult(p00,(1-u)*(1-v))
                        .add(p5.Vector.mult(p10,u*(1-v)))
                        .add(p5.Vector.mult(p01,(1-u)*v))
                        .add(p5.Vector.mult(p11,u*v));

                let dbDu =   p5.Vector.mult(p00,-(1-v))
                        .add(p5.Vector.mult(p10,1-v))
                        .add(p5.Vector.mult(p01,-v))
                        .add(p5.Vector.mult(p11,v));

                let dbDv =   p5.Vector.mult(p00,-(1-u))
                        .add(p5.Vector.mult(p10,-u))
                        .add(p5.Vector.mult(p01,1-u))
                        .add(p5.Vector.mult(p11,u));

                let c = p5.Vector.sub(p5.Vector.add(lc,ld),b);

                let dcDu = p5.Vector.sub(p5.Vector.add(dlcDu,dldDu),dbDu);
                let dcDv = p5.Vector.sub(p5.Vector.add(dlcDv,dldDv),dbDv);

                let n = p5.Vector.cross(dcDu, dcDv).setMag(this.thickness);
                n.mult(this.surfaceScale.x,this.surfaceScale.y,this.surfaceScale.z);
                let pF = p5.Vector.add(c,n);
                let pB = p5.Vector.sub(c,n);

                pointsF.push(pF);
                pointsB.push(pB);
                uvs.push([u,v]);
            }
        }

        g.vertices = pointsF.concat(pointsB);
        g.uvs = uvs.concat(uvs);

        let k = Math.floor(pointsF.length**0.5);//+k:一列移動
        let k2 = pointsF.length;//+k2:裏面に移動
        let k3 = k*(k-1);//+k3:最初の列のとき最後の列に移動

        for(let n = 0; n < k-1; n ++){
            for(let m = 0; m < k-1; m ++){
                let p = n*k+m;
                g.faces.push([p,p+1,p+k]);//表面.
                g.faces.push([p+1,p+k,p+k+1]);

                g.faces.push([p+k2,p+1+k2,p+k+k2]);//裏面.
                g.faces.push([p+1+k2,p+k+k2,p+k+1+k2]);
            }
        }

        //側面
        for(let n = 0; n < k-1; n ++){
            g.faces.push([n,n+1,n+k2]);
            g.faces.push([n+1,n+k2,n+k2+1]);

            g.faces.push([n+k3,n+1+k3,n+k2+k3]);
            g.faces.push([n+1+k3,n+k2+k3,n+k2+1+k3]);

            let m = n*k;
            g.faces.push([m,m+k,m+k2]);
            g.faces.push([m+k,m+k2,m+k+k2]);

            m = (n+1)*k-1;
            g.faces.push([m,m+k,m+k2]);
            g.faces.push([m+k,m+k2,m+k+k2]);
        }

        g.computeNormals();

        this.surfaceModel = g;
        return this;

    }

    #curve(t,p0,p1,m){
        return p5.Vector.add(p0,p1).add(p5.Vector.mult(m,-2)).mult(2*t**2).add(
            p5.Vector.mult(m,4).add(p5.Vector.mult(p0,-3)).sub(p1).mult(t)
        ).add(p0);   
    }

    #dcurveDt(t,p0,p1,m){
        return p5.Vector.add(p0,p1).add(p5.Vector.mult(m,-2)).mult(4*t).add(
            p5.Vector.mult(m,4).add(p5.Vector.mult(p0,-3)).sub(p1)
        );   
    }

}

function searchNodes(block,blocks){//ノードを探す.
    let strings = block.getChild("Data").getChildren("String");
    let edges = [];//順番は下右上左.
    let edgePoses = [];
    let starts = [];
    let ends = [];
    let cornPoses = [];
    for(let str of strings){
        if(str.getString("key") === "edges"){
            edges = str.getContent().split("|");
            break;
        }
    }

    if(edges.length == 0){
        return {corns:null,mids:null};
    }

    for(let nBlock of blocks){
        if(edges.includes(nBlock.getString("guid"))){
            for(let n = 0; n < edges.length; n++){
                if(edges[n] == nBlock.getString("guid")){

                    let nPos = nBlock.getChild("Transform").getChild("Position");
                    edgePoses[n] = createVector(nPos.getNum("x"),nPos.getNum("y"),nPos.getNum("z"));
                    let nStrings = nBlock.getChild("Data").getChildren("String");
                    for(let ns of nStrings){
                        if(ns.getString("key") === "start"){
                            starts[n] = ns.getContent();
                        }
                        if(ns.getString("key") === "end"){
                            ends[n] = ns.getContent();
                        }
                    }
                }
            }
        }
    }

    if(edges.length != starts.length){
        return {corns:null,mids:null};
    }

    let fixed = fixLoop(starts,ends);
    starts = fixed.s;
    ends = fixed.e;

    for(let nBlock of blocks){
        if(starts.includes(nBlock.getString("guid"))){
            for(let n = 0; n < starts.length; n++){
                if(starts[n] == nBlock.getString("guid")){

                    let nPos = nBlock.getChild("Transform").getChild("Position");
                    cornPoses[n] = createVector(nPos.getNum("x"),nPos.getNum("y"),nPos.getNum("z"));

                }
            }
        }
    }

    if(starts.length == 3){
        cornPoses[3] = cornPoses[0].copy();
        edgePoses[3] = cornPoses[0].copy();
    }

    let nCornPoses = [cornPoses[0],cornPoses[1],cornPoses[3],cornPoses[2]];
    let nEdgePoses = [edgePoses[0],edgePoses[2],edgePoses[3],edgePoses[1]];

    return {corns:nCornPoses,mids:nEdgePoses};
}

function rotateQuaternion(x, y, z, w){

  let n = Math.sqrt(w*w + x*x + y*y + z*z);
  w/=n; x/=n; y/=n; z/=n;

  let angle = 2*Math.acos(w);
  let s = Math.sqrt(1-w*w);

  let ax=1, ay=0, az=0;

  if(s>0.00001){
    ax=x/s;
    ay=y/s;
    az=z/s;
  }

  rotate(angle,[ax,ay,az]);
}

function antiRotateQuaternion(x, y, z, w){

  let n = Math.sqrt(w*w + x*x + y*y + z*z);
  w/=n; x/=n; y/=n; z/=n;

  let angle = 2*Math.acos(w);
  let s = Math.sqrt(1-w*w);

  let ax=1, ay=0, az=0;

  if(s>0.00001){
    ax=x/s;
    ay=y/s;
    az=z/s;
  }

  rotate(angle,[-ax,-ay,-az]);
}

function rotateVectorByQuaternion(v, q) {

  let nq = normalizeQuat(q);

  // クォータニオン共役
  const qConj = {
    w: nq.w,
    x: -nq.x,
    y: -nq.y,
    z: -nq.z
  };

  // ベクトルをクォータニオン化（w=0）
  const vQuat = {
    w: 0,
    x: v.x,
    y: v.y,
    z: v.z
  };

  // q * v * q^-1
  const temp = quatMultiply(nq, vQuat);
  const result = quatMultiply(temp, qConj);

  return createVector(result.x,result.y,result.z);

}

function quatMultiply(a, b) {
  return {
    w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
    x: a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
    y: a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
    z: a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w
  };
}

function normalizeQuat(q){
  let len = Math.sqrt(q.w*q.w + q.x*q.x + q.y*q.y + q.z*q.z);
  return {
    w: q.w/len,
    x: q.x/len,
    y: q.y/len,
    z: q.z/len
  };
}

function rotatePx(p, theta) {
  let c = Math.cos(theta);
  let s = Math.sin(theta);

  return createVector(p.x, p.y*c - p.z*s, p.y*s + p.z*c);
}

function rotatePy(p, theta) {
  let c = Math.cos(theta);
  let s = Math.sin(theta);

  return createVector(p.x*c + p.z*s, p.y, -p.x*s + p.z*c);
}

function rotatePz(p, theta) {
  let c = Math.cos(theta);
  let s = Math.sin(theta);

  return createVector(p.x*c - p.y*s, p.x*s + p.y*c, p.z);
}

function rotatePitch(v, p) {
  // v: p5.Vector（回転したい方向ベクトル）
  // p: 回転角（ラジアン）

  const up = createVector(0, 1, 0);

  // right軸 = v × up（または up × v でもOK、向きが逆になるだけ）
  let right = p5.Vector.cross(v, up);

  // ほぼ真上/真下対策（長さが0に近い）
  if (right.magSq() < 1e-8) {
    right = createVector(1, 0, 0); // 適当な軸
  } else {
    right.normalize();
  }

  // ロドリゲスの回転公式
  let cosP = Math.cos(p);
  let sinP = Math.sin(p);

  let term1 = p5.Vector.mult(v, cosP);
  let term2 = p5.Vector.mult(p5.Vector.cross(right, v), sinP);
  let term3 = p5.Vector.mult(right, p5.Vector.dot(right, v) * (1 - cosP));

  return p5.Vector.add(term1, term2).add(term3);
}

function rotateYXZ(rot){
    rotateY(rot.y);
    rotateX(rot.x);
    rotateZ(rot.z);
}

function lookAt(n, u) {
  // n: forward（向きたい方向）
  // u: up（上方向）

  // 正規化
  let forward = p5.Vector.normalize(n);

  // right = u × n
  let right = p5.Vector.normalize(p5.Vector.cross(u, forward));

    // forward と right が平行に近い場合の対策
  if (right.mag() < 1e-6) {
    // 適当な別の軸で再構成
    right = p5.Vector.normalize(p5.Vector.cross(createVector(0,1,0), forward));
    if (right.mag() < 1e-6) {
      right = p5.Vector.normalize(p5.Vector.cross(createVector(1,0,0), forward));
    }
  }

  // 再計算された up
  let up = p5.Vector.cross(forward, right);

  // 回転行列（列ベクトル）
  let m00 = right.x,   m01 = up.x,   m02 = forward.x;
  let m10 = right.y,   m11 = up.y,   m12 = forward.y;
  let m20 = right.z,   m21 = up.z,   m22 = forward.z;

  // 行列 → クォータニオン変換
  let trace = m00 + m11 + m22;
  let q = {};

  if (trace > 0) {
    let s = Math.sqrt(trace + 1.0) * 2;
    q.w = 0.25 * s;
    q.x = (m21 - m12) / s;
    q.y = (m02 - m20) / s;
    q.z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    let s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
    q.w = (m21 - m12) / s;
    q.x = 0.25 * s;
    q.y = (m01 + m10) / s;
    q.z = (m02 + m20) / s;
  } else if (m11 > m22) {
    let s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
    q.w = (m02 - m20) / s;
    q.x = (m01 + m10) / s;
    q.y = 0.25 * s;
    q.z = (m12 + m21) / s;
  } else {
    let s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
    q.w = (m10 - m01) / s;
    q.x = (m02 + m20) / s;
    q.y = (m12 + m21) / s;
    q.z = 0.25 * s;
  }

  return normalizeQuat(q);
}

function rotateToVector(v) {
  let len = sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
  if (len === 0) return;

  // 正規化
  let x = v.x / len;
  let y = v.y / len;
  let z = v.z / len;

  // ヨー（y軸回転）
  let yaw = atan2(x, z);

  // ピッチ（x軸回転）
  let pitch = -atan2(y, sqrt(x*x + z*z));

  rotateY(yaw);
  rotateX(pitch);
}

function fixLoop(starts, ends){

  let n = starts.length;

  for(let mask = 0; mask < (1<<n); mask++){

    let s = [];
    let e = [];

    // 向きを決める
    for(let i=0;i<n;i++){
      if(mask & (1<<i)){
        s[i] = ends[i];
        e[i] = starts[i];
      }else{
        s[i] = starts[i];
        e[i] = ends[i];
      }
    }

    // 連鎖チェック
    let ok = true;

    for(let i=0;i<n;i++){
      let next = (i+1)%n;
      if(e[i] !== s[next]){
        ok = false;
        break;
      }
    }

    if(ok){
      return {s:s, e:e};
    }
  }

  return null;
}

function drawCamLine(list) {
    stroke(60);
    strokeWeight(0.5);

    // 10本超えたら普通の線
    if (list.length > 100) {
        beginShape(LINES);
        for (let line of list) {
            vertex(line[0], line[1], line[2]);
            vertex(line[3], line[4], line[5]);
        }
        endShape();
    } else {
        // 破線設定
        const dashLength = 0.2;  // 描く長さ
        const gapLength = 0.2;   // 空白
        const step = dashLength + gapLength;

        beginShape(LINES);

        for (let line of list) {
            let x1 = line[0], y1 = line[1], z1 = line[2];
            let x2 = line[3], y2 = line[4], z2 = line[5];

            let dx = x2 - x1;
            let dy = y2 - y1;
            let dz = z2 - z1;

            let len = Math.sqrt(dx*dx + dy*dy + dz*dz);

            let ux = dx / len;
            let uy = dy / len;
            let uz = dz / len;

            for (let t = 0; t < len; t += step) {
                let start = t;
                let end = Math.min(t + dashLength, len);

                let sx = x1 + ux * start;
                let sy = y1 + uy * start;
                let sz = z1 + uz * start;

                let ex = x1 + ux * end;
                let ey = y1 + uy * end;
                let ez = z1 + uz * end;

                vertex(sx, sy, sz);
                vertex(ex, ey, ez);
            }
        }

        endShape();
    }

    noStroke();
}

function rgbToHsv(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h /= 6;
    if (h < 0) h += 1;
  }

  let s = max === 0 ? 0 : d / max;
  let v = max;

  return {h:h, s:s, v:v};
}

function hsvToRgb(h, s, v) {
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  let mod = i % 6;
  let r, g, b;

  if (mod === 0) [r, g, b] = [v, t, p];
  else if (mod === 1) [r, g, b] = [q, v, p];
  else if (mod === 2) [r, g, b] = [p, v, t];
  else if (mod === 3) [r, g, b] = [p, q, v];
  else if (mod === 4) [r, g, b] = [t, p, v];
  else [r, g, b] = [v, p, q];

  return {r:r, g:g, b:b};
}

//rbgから色相を抽出しhsvにしrgbとして返す
function convertRGB(r, g, b, s, v) {
  return hsvToRgb(rgbToHsv(r, g, b).h, s, v);
}