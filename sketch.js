let testBsg;
let loadBsg;

let testObj;
let testTex;

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

let surfaces = [];

let rotX = -0.4;
let rotY = 0.6;
let distance = 15*blockScale;

let center = {x:0, y:-5.05*blockScale, z:0};

let prevTouches = [];

let showPinCam = true;

let loadedFiles = 0;
let blockNum = 90;

function preload(){
    testBsg = loadXML("test.bsg", xmlLoaded);
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
}

function setup(){
    createCanvas(windowWidth, windowHeight, WEBGL);
    document.getElementById("loading").style.display = "none";
    textureMode(NORMAL);
    textAlign(CENTER,CENTER);
    let input = createFileInput(handleFile);
    input.position(10, 10).attribute("accept", ".bsg");

    let btn = createButton("Reset Camera");
    btn.position(10, 50);
    btn.mousePressed(resetCamera);

    let btnPinCam = createButton("pin,camera show/hide");
    btnPinCam.position(10, 80);
    btnPinCam.mousePressed(pinCamToggle);

    document.oncontextmenu = () => false;
}

function pinCamToggle(){
    showPinCam = !showPinCam;
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

function draw(){
    background(190);
    perspective(PI/3, width/height, 0.001, 10000);
    updateCamera();

    if(machineLoaded){
        try {
            loadMachine(loadBsg);
        } catch(e) {
            console.error(e);
            alert("ファイルが読み込めませんでした");
            loadBsg = testBsg;
        }
    }

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
  distance += e.delta*0.3;
  distance = max(50, distance);
}


function panCamera(dx, dy){

  let panSpeed = distance * 0.001;

  let rightX = cos(rotY);
  let rightZ = -sin(rotY);

  center.x -= dx * panSpeed * rightX;
  center.z -= dx * panSpeed * rightZ;

  center.y -= dy * panSpeed;
}

function touchMoved(){

  if(touches.length === 1){

    let dx = touches[0].x - prevTouches[0].x;
    let dy = touches[0].y - prevTouches[0].y;

    rotY -= dx * 0.01;   
    rotX -= dy * 0.01;

  }

  if(touches.length === 2 && prevTouches.length === 2){

    let d1 = dist(
      touches[0].x, touches[0].y,
      touches[1].x, touches[1].y
    );

    let d0 = dist(
      prevTouches[0].x, prevTouches[0].y,
      prevTouches[1].x, prevTouches[1].y
    );

    distance += (d0 - d1);

    let midX = (touches[0].x + touches[1].x)/2;
    let midY = (touches[0].y + touches[1].y)/2;

    let pmidX = (prevTouches[0].x + prevTouches[1].x)/2;
    let pmidY = (prevTouches[0].y + prevTouches[1].y)/2;

    panCamera(midX - pmidX, midY - pmidY);
  }

  prevTouches = touches.map(t=>({x:t.x,y:t.y}));

  return false;
}

function touchStarted(){
  prevTouches = touches.map(t=>({x:t.x,y:t.y}));
}

function resetCamera(){
  rotX = -0.4;
  rotY = 0.6;
  distance = 15*blockScale;

  center = {x:0, y:-5.05*blockScale, z:0};
}


function handleFile(file){
    machineLoaded = false;
    loadBsg = loadXML(file.data, xmlLoaded);
}

function xmlLoaded(){
    machineLoaded = true;
    surfaces = [];
}

function loadMachine(bsg){
    noStroke();
    let global = bsg.getChild("Global");
    let globalPos = global.getChild("Position");
    let globalRot = global.getChild("Rotation");

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

        if(id == 73){ //サフェ.

            let guid = block.getString("guid");
            let found = false;
            for(let surface of surfaces){
                if(surface.guid == guid){
                    found = true;
                    texture(textures[73]);
                    model(surface.surfaceModel);
                }
            }

            if(!found){
                let single = block.getChild("Data").getChildren("Single");
                let thickness = 0.08;
                for(let s of single){
                    if(s.getString("key") === "bmt-thickness"){
                    thickness = Number(s.getContent());
                    }
                }

                let nodes = searchNodes(block,blocks);
                let surfaceModel = buildSurface(nodes.corns,nodes.mids,thickness,guid);
                surfaces.push(new Surface(guid,nodes.corns,nodes.mids,surfaceModel));
            }

        }else if(block.hasAttribute("modId")){//mod

        }else if(id == 71 || id == 72){//サフェのノード.

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

        //反転(F)
        let booleans = block.getChild("Data").getChildren("Boolean");
        let isFlipped = false;
        for(let bool of booleans){
            if(bool.getString("key") === "flipped" && bool.getContent() === "True"){
                isFlipped = true;
            }
        }
        if(isFlipped && (id == 26 || id == 55)){//ペラのみ.
            scale(1,-1,1);
        }

        //二点を結ぶブレース等.
        let vec = block.getChild("Data").getChildren("Vector3");
        let isBrace = false;
        let startPos = createVector(0,0,0);
        let startRot = createVector(0,0,0);
        let endPos = createVector(0,0,0);
        let endRot = createVector(0,0,0);
        for(let v of vec){
            if(v.getString("key") === "start-position"){
                startPos = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
            if(v.getString("key") === "start-rotation"){
                startRot = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
            if(v.getString("key") === "end-position"){
                isBrace = true;
                endPos = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
            if(v.getString("key") === "end-rotation"){
                endRot = createVector(Number(v.getChild("X").getContent()),
                                        Number(v.getChild("Y").getContent()),
                                        Number(v.getChild("Z").getContent()));
            }
        }
        let braceLength = p5.Vector.sub(startPos,endPos).mag();

        scale(scl.getNum("x"),
            scl.getNum("y"),
            scl.getNum("z"));



        if(isBrace){//二点を結ぶブレース等.

            push();
            translate(p5.Vector.add(endPos,startPos).div(2));
            rotateToVector(p5.Vector.sub(endPos,startPos));
            scale(1,1,braceLength);
            texture(textures[id]);
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

            
            push();
            translate(startPos);

            antiRotateQuaternion(rot.getNum("x"),
                         rot.getNum("y"),
                         rot.getNum("z"),
                         rot.getNum("w"));
            angleMode(DEGREES);
            rotateYXZ(startRot);
            angleMode(RADIANS);

            texture(textures[id]);
            model(objs[id]);
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

                texture(textures[id]);
                if(id == 75){
                    model(endDistMeter);
                }else{
                    model(objs[id]);
                }
                pop();
            }

        }else{
            scale(-1,1,1);

            texture(textures[id]);

            let modelObj = objs[id];

            if(id == 1 || id == 41 || id == 63){//短縮.
                let inte = block.getChild("Data").getChildren("Integer");
                for(let i of inte){
                    if(i.getString("key") === 'length'){
                        if(id == 1 && Number(i.getContent()) == 1){
                            modelObj = shortenedWood;
                        }
                        if(id == 41 && Number(i.getContent()) == 1){
                            modelObj = shortenedPole;
                        }
                        if(id == 63 && Number(i.getContent()) == 2){
                            modelObj = shortenedLog;
                        }
                    }
                }
            }

            model(modelObj);
            
        }

        pop();
        }

    }
    if(showPinCam){
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
                let crot = 0;
                let pitch = 0;
                for(let s of singles){
                    if(s.getString("key") === "bmt-distance"){
                        dist = Number(s.getContent());
                    }
                    if(s.getString("key") === "bmt-height"){
                        heit = Number(s.getContent());
                    }
                    if(s.getString("key") === "bmt-rotation"){
                        crot = Number(s.getContent());
                    }
                    if(s.getString("key") === "bmt-pitch"){
                        pitch = Number(s.getContent());
                    }                
                }

                push();

                rotateQuaternion(rot.getNum("x"),
                                rot.getNum("y"),
                                rot.getNum("z"),
                                rot.getNum("w"));

                let yawPitch = calculateQuatToEuler(rot.getNum("x"),
                                                    rot.getNum("y"),
                                                    rot.getNum("z"),
                                                    rot.getNum("w"));

                angleMode(RADIANS);                                    
                console.log(yawPitch.pitch/Math.PI*180);
                if(yawPitch.pitch >= Math.PI/4){
                    rotateX(Math.PI/2);
                    rotateY(Math.PI);
                }
                if(yawPitch.pitch <= -Math.PI/4){
                    rotateX(-Math.PI/2);
                }

                rotateY(Math.PI);

                let p = createVector(0,0,-dist);
                p = rotatePx(p,radians(heit));
                p = rotatePy(p,radians(crot));
                
                stroke(100);
                strokeWeight(0.5);
                dashedLine(0,0,0,p.x,p.y,p.z);
                noStroke();

                angleMode(DEGREES);

                rotateY(crot);
                rotateX(heit);
                translate(0,0,-dist);
                rotateX(-pitch);
                angleMode(RADIANS);

                scale(scl.getNum("x"),
                    scl.getNum("y"),
                    scl.getNum("z"));
                scale(-1,1,1);

                drawingContext.disable(drawingContext.DEPTH_TEST);
                texture(textures[id]);
                model(cameraBlock);
                drawingContext.enable(drawingContext.DEPTH_TEST);
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

            drawingContext.disable(drawingContext.DEPTH_TEST);
            tint(255, 120);
            texture(textures[id]);
            model(objs[id]);
            drawingContext.enable(drawingContext.DEPTH_TEST);

            pop();
        }
    }

    pop();
}

class Surface{
    constructor(guid,corns,mids,surfaceModel){
        this.guid = guid;
        this.corns = corns;
        this.mids = mids;
        this.surfaceModel = surfaceModel;
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
        }
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

function buildSurface(corns,mids,thickness,guid){//ノードからメッシュを作成.
    let p00 = corns[0];
    let p10 = corns[1];
    let p01 = corns[2];
    let p11 = corns[3];

    let mX0 = mids[0];
    let mX1 = mids[1];
    let m0Y = mids[2];
    let m1Y = mids[3];

    let g = new p5.Geometry();
    g.gid = guid;

    let detail = 8;
    let delta = 1/detail;

    let pointsF = [];
    let pointsB = [];
    let uvs = [];
    for(let u = 0; u <= 1 + delta/2; u += delta){

            let c0 = curve(u,p00,p10,mX0);
            let c1 = curve(u,p01,p11,mX1);

            let dc0Du = dcurveDt(u,p00,p10,mX0);
            let dc1Du = dcurveDt(u,p01,p11,mX1);

            if(u == 0){//端に微小量追加
                c0 = curve(0.01*delta,p00,p10,mX0);
                c1 = curve(0.01*delta,p01,p11,mX1);
                dc0Du = dcurveDt(0.01*delta,p00,p10,mX0);
                dc1Du = dcurveDt(0.01*delta,p01,p11,mX1);
            }else if(u <= 1 - delta/2){
                c0 = curve(u-0.01*delta,p00,p10,mX0);
                c1 = curve(u-0.01*delta,p01,p11,mX1);
                dc0Du = dcurveDt(u-0.01*delta,p00,p10,mX0);
                dc1Du = dcurveDt(u-0.01*delta,p01,p11,mX1);
            }

        for(let v = 0; v <= 1 + delta/2; v += delta){
            let d0 = curve(v,p00,p01,m0Y);
            let d1 = curve(v,p10,p11,m1Y);

            let dD0Dv = dcurveDt(v,p00,p01,m0Y);
            let dD1Dv = dcurveDt(v,p10,p11,m1Y);

            if(v == 0){//端に微小量追加
                d0 = curve(0.01*delta,p00,p01,m0Y);
                d1 = curve(0.01*delta,p10,p11,m1Y);
                dD0Dv = dcurveDt(0.01*delta,p00,p01,m0Y);
                dD1Dv = dcurveDt(0.01*delta,p10,p11,m1Y);
            }else if(v <= 1 - delta/2){
                d0 = curve(v-0.01*delta,p00,p01,m0Y);
                d1 = curve(v-0.01*delta,p10,p11,m1Y);
                dD0Dv = dcurveDt(v-0.01*delta,p00,p01,m0Y);
                dD1Dv = dcurveDt(v-0.01*delta,p10,p11,m1Y);
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

            let n = p5.Vector.cross(dcDu, dcDv).setMag(thickness);
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

    return g;

    function curve(t,p0,p1,m){
        return p5.Vector.add(p0,p1).add(p5.Vector.mult(m,-2)).mult(2*t**2).add(
            p5.Vector.mult(m,4).add(p5.Vector.mult(p0,-3)).sub(p1).mult(t)
        ).add(p0);   
    }

    function dcurveDt(t,p0,p1,m){
        return p5.Vector.add(p0,p1).add(p5.Vector.mult(m,-2)).mult(4*t).add(
            p5.Vector.mult(m,4).add(p5.Vector.mult(p0,-3)).sub(p1)
        );   
    }

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

function calculateQuatToEuler(x,y,z,w){
    let qyp = getYawPitch(x,y,z);
    let yaw = qyp.yaw;
    let pitch = qyp.pitch;
    let theta = 2 * Math.acos(w);
    let p = createVector(0,0,1);
    p = rotatePy(p,-yaw);
    p = rotatePz(p,-pitch);
    p = rotatePx(p,theta);
    p = rotatePz(p,pitch);
    p = rotatePy(p,yaw);
    let vyp = getYawPitch(p.x,p.y,p.z);
    return {yaw: vyp.yaw, pitch: vyp.pitch};

}

function getYawPitch(x, y, z) {

  let yaw = Math.atan2(z, x);

  let r = Math.sqrt(x*x + z*z);
  let pitch = Math.atan2(y, r);

  return {
    yaw: yaw,
    pitch: pitch
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

function rotateYXZ(rot){
    rotateY(rot.y);
    rotateX(rot.x);
    rotateZ(rot.z);
}

function dashedLine(x1,y1,z1, x2,y2,z2, dash=0.7, gap=0.5){
  let dir = createVector(x2-x1, y2-y1, z2-z1);
  let len = dir.mag();
  dir.normalize();

  let dist = 0;

  while(dist < len){
    let start = dist;
    let end = min(dist + dash, len);

    line(
      x1 + dir.x*start,
      y1 + dir.y*start,
      z1 + dir.z*start,
      x1 + dir.x*end,
      y1 + dir.y*end,
      z1 + dir.z*end
    );

    dist += dash + gap;
  }
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