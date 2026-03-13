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

        scale(scl.getNum("x"),
            scl.getNum("y"),
            scl.getNum("z"));



        if(isBrace){//二点を結ぶブレース等.
            angleMode(DEGREES);
            push();
            translate(startPos);
            rotateXYZ(startRot);
            texture(textures[id]);
            model(objs[id]);
            pop();

            push();
            translate(endPos);
            rotateXYZ(endRot);
            texture(textures[id]);
            model(objs[id]);
            pop();

            stroke(10);
            strokeWeight(0.2*blockScale);
            lineV(startPos,endPos);

            angleMode(RADIANS);
            noStroke();
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
    let overlap = false;
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
                            if(starts.includes(ns.getContent())){
                                overlap = true;
                            }
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

    if(overlap){
        let fixed = fixLoop(starts,ends);
        starts = fixed.s;
        ends = fixed.e;
    }

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

    let detail = 1/8;
    let pointslist = [];
    for(let u = 0; u <= 1+ detail/2; u += detail){
        let points = [];

            let c0 = curve(u,p00,p10,mX0);
            let c1 = curve(u,p01,p11,mX1);

        for(let v = 0; v <= 1 + detail/2; v += detail){
            let d0 = curve(v,p00,p01,m0Y);
            let d1 = curve(v,p10,p11,m1Y);

            let lc = p5.Vector.mult(c0,1-v).add(p5.Vector.mult(c1,v));
            let ld = p5.Vector.mult(d0,1-u).add(p5.Vector.mult(d1,u));

            let b =      p5.Vector.mult(p00,(1-u)*(1-v))
                    .add(p5.Vector.mult(p10,u*(1-v)))
                    .add(p5.Vector.mult(p01,(1-u)*v))
                    .add(p5.Vector.mult(p11,u*v));

            let c = p5.Vector.sub(p5.Vector.add(lc,ld),b);

            points.push([c.x,c.y,c.z,u,v]);

        }
        pointslist.push(points);
    }

  let g = new p5.Geometry();
  g.gid = guid;

  let cols = pointslist.length;
  let rows = pointslist[0].length;

  let normals = computeNormals(pointslist);

  let frontIndex = [];
  let backIndex = [];

  // ----- 頂点生成 -----

  for(let i=0;i<cols;i++){
    frontIndex[i]=[];
    backIndex[i]=[];

    for(let j=0;j<rows;j++){

      let p = pointslist[i][j];
      let n = normals[i][j];

      let fx=p[0]+n[0]*thickness;
      let fy=p[1]+n[1]*thickness;
      let fz=p[2]+n[2]*thickness;

      let bx=p[0]-n[0]*thickness;
      let by=p[1]-n[1]*thickness;
      let bz=p[2]-n[2]*thickness;

      frontIndex[i][j] = g.vertices.length;
      g.vertices.push(createVector(fx,fy,fz));
      g.uvs.push([p[3],p[4]]);

      backIndex[i][j] = g.vertices.length;
      g.vertices.push(createVector(bx,by,bz));
      g.uvs.push([p[3],p[4]]);
    }
  }

  function tri(a,b,c){
    g.faces.push([a,b,c]);
  }

  // ----- 表面 -----

  for(let i=0;i<cols-1;i++){
  for(let j=0;j<rows-1;j++){

    let A=frontIndex[i][j];
    let B=frontIndex[i+1][j];
    let C=frontIndex[i][j+1];
    let D=frontIndex[i+1][j+1];

    tri(A,B,C);
    tri(B,D,C);
  }}

  // ----- 裏面 -----

  for(let i=0;i<cols-1;i++){
  for(let j=0;j<rows-1;j++){

    let A=backIndex[i][j];
    let B=backIndex[i+1][j];
    let C=backIndex[i][j+1];
    let D=backIndex[i+1][j+1];

    tri(C,B,A);
    tri(C,D,B);
  }}

  // ----- 側面 (四辺) -----

  for(let i=0;i<cols-1;i++){

    let A=frontIndex[i][0];
    let B=frontIndex[i+1][0];
    let C=backIndex[i][0];
    let D=backIndex[i+1][0];

    tri(B,A,C);
    tri(B,C,D);

    A=frontIndex[i][rows-1];
    B=frontIndex[i+1][rows-1];
    C=backIndex[i][rows-1];
    D=backIndex[i+1][rows-1];

    tri(A,B,C);
    tri(B,D,C);
  }

  for(let j=0;j<rows-1;j++){

    let A=frontIndex[0][j];
    let B=frontIndex[0][j+1];
    let C=backIndex[0][j];
    let D=backIndex[0][j+1];

    tri(A,B,C);
    tri(B,D,C);

    A=frontIndex[cols-1][j];
    B=frontIndex[cols-1][j+1];
    C=backIndex[cols-1][j];
    D=backIndex[cols-1][j+1];

    tri(B,A,C);
    tri(D,B,C);
  }

  g.computeNormals();

    return g;

    function curve(t,p0,p1,m){
        return p5.Vector.add(p0,p1).add(p5.Vector.mult(m,-2)).mult(2*t**2).add(
            p5.Vector.mult(m,4).add(p5.Vector.mult(p0,-3)).sub(p1).mult(t)
        ).add(p0);
        
    }
    
}

function computeNormals(pointslist){

  let cols = pointslist.length;
  let rows = pointslist[0].length;

  let normals = [];

  for(let i=0;i<cols;i++){
    normals[i]=[];
    for(let j=0;j<rows;j++){
      normals[i][j]=[0,0,0];
    }
  }

  function addNormal(i,j,a,b,c){

    let ax=b[0]-a[0];
    let ay=b[1]-a[1];
    let az=b[2]-a[2];

    let bx=c[0]-a[0];
    let by=c[1]-a[1];
    let bz=c[2]-a[2];

    let nx = ay*bz-az*by;
    let ny = az*bx-ax*bz;
    let nz = ax*by-ay*bx;

    normals[i][j][0]+=nx;
    normals[i][j][1]+=ny;
    normals[i][j][2]+=nz;
  }

  for(let i=0;i<cols-1;i++){
    for(let j=0;j<rows-1;j++){

      let A=pointslist[i][j];
      let B=pointslist[i+1][j];
      let C=pointslist[i][j+1];
      let D=pointslist[i+1][j+1];

      addNormal(i,j,A,B,C);
      addNormal(i+1,j,B,D,A);
      addNormal(i,j+1,C,A,D);
      addNormal(i+1,j+1,D,C,B);
    }
  }

  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){

      let n=normals[i][j];
      let l=Math.hypot(n[0],n[1],n[2])||1;

      n[0]/=l;
      n[1]/=l;
      n[2]/=l;
    }
  }

  return normals;
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

function rotateXYZ(rot){
    rotateX(rot.x);
    rotateY(rot.y);
    rotateZ(rot.z);
}

function lineV(p,q){
    line(p.x,p.y,p.z,q.x,q.y,q.z);
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

function fixLoop(s, e){

  let n = s.length;

  for(let i=0;i<n;i++){

    let j = (i+1)%n;

    if(e[i] != s[j]){

      if(e[i] == e[j]){
        // 反転
        let tmp = s[j];
        s[j] = e[j];
        e[j] = tmp;
      }

    }

  }

  return {s:s, e:e};
}