const express=require("express"),http=require("http"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server);
const PORT=process.env.PORT||3000, W=1280,H=720;
const PHYS={tick:60,gravity:1900,run:520,jump:735,fastFall:900,dash:980,dashTime:.14,dashCd:.8,accel:3400,friction:2600,maxFall:1250,playerW:30,playerH:64,attackCd:.34,attackTime:.16,respawn:3};
const platforms=[{x:0,y:650,w:1280,h:70},{x:185,y:500,w:250,h:24},{x:530,y:405,w:220,h:24},{x:900,y:505,w:245,h:24}];
const players=new Map(),inputs=new Map(),ids=[{x:120,y:580},{x:1160,y:580},{x:340,y:430},{x:760,y:335},{x:1030,y:435}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),now=()=>Date.now()/1000;
function cleanName(n){return String(n||"Wanderer").replace(/[^\w -]/g,"").trim().slice(0,16)||"Wanderer"}
function spawn(p){let s=ids[Math.floor(Math.random()*ids.length)];p.x=s.x;p.y=s.y;p.vx=p.vy=0;p.hp=5;p.soul=0;p.dead=0;p.attack=0;p.attackType=0;p.attackCd=0;p.dash=0;p.dashCd=0;p.channel=0}
function body(p){return{x:p.x,y:p.y,w:PHYS.playerW,h:PHYS.playerH}}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function hurtbox(p){return{x:p.x-15,y:p.y-64,w:30,h:64}}
function attackbox(p){let d=p.face||1,type=p.attackType; if(type===1)return{x:p.x-38,y:p.y-82,w:76,h:34};if(type===2)return{x:p.x+d*10-8,y:p.y-94,w:32,h:80};return{x:p.x+d*18+(d<0?-70:0),y:p.y-55,w:70,h:34}}
function init(id){return{type:"init",id,W,H,platforms,phys:PHYS,players:[...players.values()].map(view),time:now()}}
function view(p){return{id:p.id,name:p.name,x:p.x,y:p.y,vx:p.vx,vy:p.vy,face:p.face,hp:p.hp,soul:p.soul,dead:p.dead,attack:p.attack,attackType:p.attackType,channel:p.channel,kills:p.kills,deaths:p.deaths}}
function broadcast(){io.emit("state",{t:now(),players:[...players.values()].map(view)})}
function kill(p,by){p.hp=0;p.dead=PHYS.respawn;p.deaths++;if(by&&by!==p.id){let k=players.get(by);if(k){k.kills++;k.soul=clamp(k.soul+35,0,100)}}}
function update(p,dt){
 if(p.dead){p.dead-=dt;if(p.dead<=0)spawn(p);return}
 let i=inputs.get(p.id)||{}, left=i.left,right=i.right;
 p.attackCd=Math.max(0,p.attackCd-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.attack=Math.max(0,p.attack-dt);
 if(p.channel){p.vx=0;p.vy=0;p.channel-=dt;if(p.channel<=0&&p.hp<5&&p.soul>=35){p.hp++;p.soul-=35}return}
 if(i.heal&&p.soul>=35&&p.hp<5){p.channel=.8;p.vx=0;return}
 if(i.dash&&p.dashCd<=0){p.dash=PHYS.dashTime;p.dashCd=PHYS.dashCd;p.face=i.dashDir||p.face;p.vx=p.face*PHYS.dash;p.vy=0}
 if(p.dash>0){p.dash-=dt;p.x+=p.vx*dt}else{let ax=(right-left)*PHYS.accel;p.vx=clamp(p.vx+ax*dt,-PHYS.run,PHYS.run);if(!ax)p.vx-=Math.sign(p.vx)*Math.min(Math.abs(p.vx),PHYS.friction*dt);p.vy+=PHYS.gravity*dt;p.vy=clamp(p.vy,-2000,PHYS.maxFall);if(i.down)p.vy+=PHYS.fastFall*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
 p.x=clamp(p.x,15,W-15);let grounded=false;
 for(const r of platforms){if(p.x+15>r.x&&p.x-15<r.x+r.w&&p.y>=r.y-2&&p.y<=r.y+28&&p.vy>=0){p.y=r.y;p.vy=0;grounded=true}}
 if(i.jump&&grounded){p.vy=-PHYS.jump}
 if(i.attack&&p.attackCd<=0){p.attack=.16;p.attackCd=PHYS.attackCd;p.attackType=i.attackType||0;p.face=i.face||p.face;for(const q of players.values())if(q!==p&&!q.dead&&hit(attackbox(p),hurtbox(q))){q.vx=p.face*570;q.vy=-320;q.soul=clamp(q.soul-8,0,100);p.soul=clamp(p.soul+22,0,100);q.hp--;io.emit("hit",{x:q.x,y:q.y,by:p.id,type:p.attackType});if(q.hp<=0)kill(q,p.id)}}
 if(p.y>H+120)kill(p,null)
}
io.on("connection",s=>{
 s.emit("init",init(s.id));
 s.on("join",n=>{if(players.has(s.id))return;let p={id:s.id,name:cleanName(n),x:0,y:0,vx:0,vy:0,face:1,hp:5,soul:0,dead:0,attack:0,attackType:0,attackCd:0,dash:0,dashCd:0,channel:0,kills:0,deaths:0};spawn(p);players.set(s.id,p);inputs.set(s.id,{});s.emit("joined",view(p));broadcast()});
 s.on("input",i=>{if(players.has(s.id))inputs.set(s.id,{...i,left:!!i.left,right:!!i.right,jump:!!i.jump,down:!!i.down,heal:!!i.heal,attack:!!i.attack,dash:!!i.dash})});
 s.on("disconnect",()=>{players.delete(s.id);inputs.delete(s.id);broadcast()})
});
let last=now(),acc=0;setInterval(()=>{let t=now(),dt=Math.min(.05,t-last);last=t;acc+=dt;while(acc>=1/PHYS.tick){for(const p of players.values())update(p,1/PHYS.tick);acc-=1/PHYS.tick}},1000/PHYS.tick);
setInterval(broadcast,50);
app.use(express.static("public"));server.listen(PORT,()=>console.log("Hollow Blade listening on "+PORT));
