const body = document.querySelector('body');

const points = [];
const locations = [];

let inside = false;
let sweepers = [];
let attempts = 15;
let done = false;

// Search range : 
range = Math.max(window.innerWidth / 4 || 200)
console.log(range)

let id = 0;

function setup(){
    console.log('canvas setup')
    createCanvas(window.innerWidth, window.innerHeight);

    const number = Math.floor(window.innerWidth / 5);

    // create multiple points : 
    for(let i = 0; i < number; i++){
        var point = new Point();
        var location = point.getInfo()
        points.push(point);
        locations.push(location);
    }
    console.log(points)
    console.log(locations);
    points.forEach((point, index)=>{
        point.darw();
    })
}

function draw(){
    points.forEach((point, index)=>{
        // point.darw();
        if(point.getInfo().id == 0){
            point.setSource();
        }
        if(point.getInfo().id == points.length-1){
            point.setDestination();
        }
    })
}


// start on click on body :
body.addEventListener('click', async ()=>{

    // 1 - find source and destinations:
    async function getSourcePosition(points){
        let sourcePosition, destPosition;
        await points.forEach(async (point, index)=>{
            if(point.name == 'source'){
                sourcePosition = point.pos;
            }
            if(point.name == 'destination'){
                destPosition = point.pos;
            }
        });
        return {sourcePosition, destPosition}
    }
    var {sourcePosition, destPosition} = await getSourcePosition(points); 

    console.log(sourcePosition.x, sourcePosition.y)
    console.log(destPosition.x, destPosition.y)

    // 2- draw a line between s and d :
    stroke('rgba(233,30,99,0.5)');
    var shortestPath = line(destPosition.x, destPosition.y, sourcePosition.x, sourcePosition.y)
    console.log('shortestPath', shortestPath)
    
    // starting point : 
    sweepers.push(sourcePosition);

    // START LOOPING : 
    async function findPath(sourcePosition){
        // 3- define the source Draw a circle : 
        stroke('rgba(255,255,255,0.1)')
        strokeWeight(1);
        noFill()
        // searching range (position, size):
        circle(sourcePosition.x, sourcePosition.y, range);
        
        // 4 - define a sweeper circle : 
        var searchingCircle = {x : sourcePosition.x, y: sourcePosition.y};
        // 5- find points in the searching range , check if there is any, if the destination is in :
        // loop throw the points and define the points on path : 
        let insidePoints = [];
        points.forEach((point, index)=>{
            // collision (point, position, radius): 
            inside = collidePointCircle(point.pos.x, point.pos.y, searchingCircle.x, searchingCircle.y, range)
            if(inside){
                console.log('point inside : ', point.id)
                insidePoints.push(point)
            }
            // if dest is found : 
            if(inside && point.name == 'destination'){
                done = true;
                console.log('found the dest, done !')
            }
        })
    
        // 6- loop throught the points inside, draw lines, set name = 'neighbor', find destances, pinkfy points, find the degree :
        console.log('insidePoints : ', insidePoints);
        let degrees = [];
        insidePoints.forEach((innerPoint, index)=>{
            // if matching the center of the searching sweeper then skip :
            if(innerPoint.pos.x == searchingCircle.x && innerPoint.pos.y == searchingCircle.y){
                console.log('skipping the center point')
            }else{
                let x1 = searchingCircle.x;
                let y1 = searchingCircle.y;
                let x2 = innerPoint.pos.x;
                let y2 = innerPoint.pos.y;
                stroke('rgba(25,255,25,0.2)');
                // line(innerPoint.pos.x, innerPoint.pos.y, searchingCircle.x, searchingCircle.y);
                // draw lines :
                line(x1, y1, x2, y2);
                // pinkfy :
                fill('rgba(233,30,99,0.5)')
                ellipse(x2, y2, 10, 10);
                // find disances :
                // d is the length of the line
                // the distance from point 1 to point 2.
                let distance = int(dist(x1, y1, x2, y2));
    
                // Let's write d along the line we are drawing!
                stroke('rgba(233,30,99,1)')
                push();
                translate((x1 + x2) / 2, (y1 + y2) / 2);
                rotate(atan2(y2 - y1, x2 - x1));
                text(nfc(distance, 0), 0, -5);
                pop();
                // Fancy!
    
                // change name : 
                innerPoint.name = 'neighbor';
    
                // find the degrees (in relative to the distenation!!): 
                // assuming the points : A,B,C : C:center, A: point inside, B : Destination 
                // assuming the distances : a,b,c : c:distance from point to target, a: distance from center to target, b : distance from center to point
                // reference : http://mathcentral.uregina.ca/QQ/database/QQ.09.07/h/lucy1.html
    
                let c =  int(dist(x2, y2, destPosition.x, destPosition.y));
                let a =  int(dist(x1, y1, destPosition.x, destPosition.y));
                let b = int(dist(x1, y1, x2, y2));
                console.log('c',c,'a',a,'b',b);
                // equation : 
                // c^2 = a^2 + b^2 - 2*a*b cos(C)
                let LHS = Math.pow(c, 2) - (Math.pow(a, 2) + Math.pow(b, 2))
                let RHS = -2 * a * b;
                let cosineC = LHS/RHS;
                console.log('cos(c): ', cosineC);
                let radian = acos(cosineC);
                let degree = radian * (180/Math.PI);
                console.log(typeof radian)
                if(Number.isNaN(radian)) {
                    // fix NaN (very very good candidate):
                    if(a >= c) radian = 0, degree = 0;
                    // fix NaN (very bad candidate):
                    if(c > a) radian = 2.5, degree = 180;
                }
                console.log('radian  : ', radian, 'degree : ', degree , 'distance :', distance);
                degrees.push({radian, degree, distance, point: innerPoint})
            }
        })
    
        // 7 - filter by degree, threshold and select the furthest by distance : 
        // set threshold to 90 degrees :
        let threshold = 90; // consider only the points 
        // sort then filter : 
        degrees.sort((a, b) => (a.radian > b.radian) ? 1 : -1) // sorted by radians 
        console.log('degrees: ', degrees)
        
        // filter the candidates:
        var candidates =  degrees.filter(function(singlePoint) {
            return singlePoint.degree <= threshold;
        });
        candidates.forEach((candidate, index)=>{
            console.log('candidate', candidate)
            // greenfy :
            fill('rgba(25,255,25,1)')
            ellipse(candidate.point.pos.x, candidate.point.pos.y, 10, 10);
        })
        // if candidates are more than 3 slice the heighest 3 ones : 
        if(candidates.length >= 3){
            candidates = candidates.slice(0, 2);
        }
        // resort by distance : 
        candidates.sort((b, a) => (a.distance > b.distance) ? 1 : -1) // sorted by radians 
        console.log('candidates: ', candidates)
        // if candidates are more than 2 slice the heighest 2 ones : 
        if(candidates.length >= 2){
            candidates = candidates.slice(0, 1);
        }
        // resort by angle : 
        candidates.sort((a, b) => (a.degree > b.degree) ? 1 : -1) // sorted by radians 
        // best candidate :
        var bestCandidate = await candidates.slice(0);
        console.log('Best Candidate : ', bestCandidate);
    
        // draw a line to the best candisate, then move to it to sweep again : 
        if(bestCandidate.length >= 1){
            stroke('rgba(255,255,255,1)');
            strokeWeight(4);
            line(searchingCircle.x, searchingCircle.y, bestCandidate[0].point.pos.x, bestCandidate[0].point.pos.y);
            sweepers.push({x: bestCandidate[0].point.pos.x, y:  bestCandidate[0].point.pos.y})
        }else{
            console.error("I'm sorry, I couldn't complete the path, add more points or enlarge the searching zone.")
        }
    }

    // loop : 
    for(let looper = 0; looper <= attempts ; looper++){
        if( done != true ){
            console.log('looper:', looper)
            await findPath(sweepers.slice(sweepers.length - 1)[0]);
            setTimeout(async ()=>{
            },5000)
        }
    }



})



// classes : 
class Point {
    constructor(){
        // position : 
        this.pos = createVector(random(width), random(height))
        // size 
        this.size = 10;
        // name : 
        this.name = 'point';
        // type :
        this.onPath = false;
        // assign id : 
        this.id = id;
        id++; // then increment the id
    }

    darw(){
        noStroke();
        fill('rgba(255,255,255,0.5)')
        circle(this.pos.x, this.pos.y, this.size)
    }

    setSource(id){
        noStroke()
        fill('rgba(233,30,99,1)')
        circle(this.pos.x, this.pos.y, this.size + 2)
        this.name = 'source';
        this.onPath = true;
    }

    setDestination(id){
        noStroke()
        fill('rgba(3,169,244,1)')
        circle(this.pos.x, this.pos.y, this.size + 2)
        this.name = 'destination';
        this.onPath = true;
    }

    // get loacation on x,y axies
    getInfo(){
        return {id: this.id, x : this.pos.x, y : this.pos.y}
    }
}