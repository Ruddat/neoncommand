import './style.css';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const keys = new Set();
let W = 0, H = 0, S, last = 0;

const C = {
  bg: '#050816', cyan: '#00d9ff', pink: '#ff2bd6', red: '#ff345d', green: '#00ff9d', yellow: '#ffb000', violet: '#7d5cff', white: '#ffffff'
};
const BUILD = {
  turret: { name: 'Laser Turret', cost: 45, color: C.pink, range: 230, rate: .28, dmg: 18 },
  factory: { name: 'Drone Factory', cost: 120, color: C.green, range: 0, rate: 0, dmg: 0 },
  generator: { name: 'Generator', cost: 70, color: C.cyan, range: 0, rate: 0, dmg: 0 },
};
const DRONE = {
  scout: { name: 'Scout Drone', cost: 35, hp: 55, speed: 210, range: 145, rate: .45, dmg: 9, color: C.green },
  combat: { name: 'Combat Drone', cost: 75, hp: 105, speed: 155, range: 190, rate: .32, dmg: 19, color: C.yellow },
};

function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; if (S) layout(); }
function layout() {
  S.core.x = W * .18; S.core.y = H * .5;
  S.enemyBase.x = W * .84; S.enemyBase.y = H * .5;
  S.nodes[0].x = W * .34; S.nodes[0].y = H * .28;
  S.nodes[1].x = W * .42; S.nodes[1].y = H * .72;
  S.nodes[2].x = W * .62; S.nodes[2].y = H * .36;
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function fresh() {
  S = {
    mode: 'menu', sel: 'turret', selectedUnits: [], energy: 260, data: 0, income: 8, score: 0, kills: 0, shake: 0, msg: 'Enter starten', msgT: 0,
    core: { x: W*.18, y: H*.5, hp: 420, max: 420 }, enemyBase: { x: W*.84, y: H*.5, hp: 900, max: 900, cd: 0 },
    commander: { x: W*.25, y: H*.5, hp: 220, max: 220, cd: 0, q: 0, e: 0, tx: W*.25, ty: H*.5 },
    nodes: [{ x: W*.34, y: H*.28, owner: 'neutral', hp: 100 }, { x: W*.42, y: H*.72, owner: 'neutral', hp: 100 }, { x: W*.62, y: H*.36, owner: 'enemy', hp: 100 }],
    buildings: [], drones: [], enemies: [], shots: [], fx: [], texts: [], mouse: { x: 0, y: 0 }, enemyTimer: 0, missionTime: 0,
  };
  layout();
}
function start() { fresh(); S.mode = 'play'; msg('MISSION: destroy the enemy factory'); }
function msg(t) { S.msg = t; S.msgT = 2.6; }
function boom(x,y,color,n=18,p=1){for(let i=0;i<n;i++){const a=Math.random()*7,s=(40+Math.random()*240)*p;S.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.35+Math.random()*.8,m:1,c:color,z:2+Math.random()*4});}}
function text(x,y,t,c=C.white){S.texts.push({x,y,t,c,l:1.2,m:1.2});}
function canAfford(v){return S.energy>=v;}
function build(type){if(S.mode!=='play')return;const b=BUILD[type],x=S.mouse.x,y=S.mouse.y;if(!b||!canAfford(b.cost))return text(x,y,'NO ENERGY',C.red);if(dist({x,y},S.core)>360)return text(x,y,'BUILD NEAR CORE',C.red);if(S.buildings.some(o=>Math.hypot(o.x-x,o.y-y)<42))return text(x,y,'BLOCKED',C.red);S.energy-=b.cost;S.buildings.push({type,x,y,hp:type==='factory'?260:150,cd:0});boom(x,y,b.color,28);text(x,y-25,b.name,b.color);}
function train(type){const f=S.buildings.find(b=>b.type==='factory');const d=DRONE[type];if(!f)return text(S.core.x,S.core.y-80,'BUILD DRONE FACTORY FIRST',C.red);if(!canAfford(d.cost))return text(f.x,f.y-35,'NO ENERGY',C.red);S.energy-=d.cost;S.drones.push({type,x:f.x+Math.random()*30-15,y:f.y+Math.random()*30-15,tx:f.x+70,ty:f.y,hp:d.hp,max:d.hp,cd:0,selected:false});boom(f.x,f.y,d.color,18);}
function selectUnits(){S.drones.forEach(d=>d.selected=false);S.selectedUnits=[];let clicked=S.drones.find(d=>Math.hypot(d.x-S.mouse.x,d.y-S.mouse.y)<22);if(clicked){clicked.selected=true;S.selectedUnits=[clicked];text(clicked.x,clicked.y-25,'SELECTED',C.green);return;}let near=S.drones.filter(d=>Math.hypot(d.x-S.mouse.x,d.y-S.mouse.y)<95);near.forEach(d=>d.selected=true);S.selectedUnits=near;}
function commandMove(x,y){if(S.selectedUnits.length){S.selectedUnits.forEach((u,i)=>{u.tx=x+(i%4-1.5)*28;u.ty=y+(Math.floor(i/4)-.5)*28;});text(x,y,'MOVE',C.green);return;}S.commander.tx=x;S.commander.ty=y;text(x,y,'COMMANDER',C.cyan);}
function spawnEnemy(){const r=Math.random(),heavy=r>.76;S.enemies.push({x:S.enemyBase.x-45,y:S.enemyBase.y+(Math.random()-.5)*80,tx:S.core.x,ty:S.core.y,hp:heavy?170:78,max:heavy?170:78,sp:heavy?55:92,dmg:heavy?28:12,range:heavy?80:55,cd:0,size:heavy?19:12,color:heavy?C.yellow:C.red});}
function nearestEnemy(x,y,range){return S.enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<range).sort((a,b)=>a.hp-b.hp)[0];}
function nearestFriendly(x,y,range){let all=[S.commander,...S.drones,S.core,...S.buildings];return all.filter(o=>Math.hypot(o.x-x,o.y-y)<range && o.hp>0).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];}
function shoot(from,to,dmg,color,speed=650){S.shots.push({x:from.x,y:from.y,t:to,dmg,color,speed,trail:[]});}
function update(dt){if(S.mode!=='play')return;S.missionTime+=dt;S.msgT-=dt;S.shake=Math.max(0,S.shake-35*dt);S.energy+=S.income*dt;S.data+=dt*(1+S.nodes.filter(n=>n.owner==='player').length*.85);S.income=8+S.buildings.filter(b=>b.type==='generator').length*6+S.nodes.filter(n=>n.owner==='player').length*7;moveCommander(dt);updateNodes(dt);updateFactories(dt);updateBuildings(dt);updateDrones(dt);updateEnemies(dt);updateShots(dt);particles(dt);texts(dt);if(S.enemyBase.hp<=0){S.mode='win';boom(S.enemyBase.x,S.enemyBase.y,C.pink,180,2.5);msg('MISSION COMPLETE');}if(S.core.hp<=0||S.commander.hp<=0){S.mode='over';msg('MISSION FAILED');}}
function moveToward(o,tx,ty,speed,dt){const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy)||1;if(d>3){o.x+=dx/d*speed*dt;o.y+=dy/d*speed*dt;}}
function moveCommander(dt){let dx=0,dy=0;if(keys.has('w'))dy--;if(keys.has('s'))dy++;if(keys.has('a'))dx--;if(keys.has('d'))dx++;if(dx||dy){const l=Math.hypot(dx,dy)||1;S.commander.tx=S.commander.x+dx/l*120;S.commander.ty=S.commander.y+dy/l*120;}moveToward(S.commander,S.commander.tx,S.commander.ty,245,dt);S.commander.cd-=dt;const target=nearestEnemy(S.commander.x,S.commander.y,255);if(target&&S.commander.cd<=0){shoot(S.commander,target,22,C.cyan,780);S.commander.cd=.17;}}
function updateNodes(dt){for(const n of S.nodes){let p=[S.commander,...S.drones].some(u=>Math.hypot(u.x-n.x,u.y-n.y)<70);let e=S.enemies.some(u=>Math.hypot(u.x-n.x,u.y-n.y)<70);if(p&&!e){n.hp=Math.min(100,n.hp+35*dt);if(n.hp>=100&&n.owner!=='player'){n.owner='player';text(n.x,n.y-40,'NODE CAPTURED',C.green);boom(n.x,n.y,C.green,45);}}else if(e&&!p){n.hp=Math.max(0,n.hp-24*dt);if(n.hp<=0&&n.owner!=='enemy'){n.owner='enemy';text(n.x,n.y-40,'NODE LOST',C.red);boom(n.x,n.y,C.red,45);}}}}
function updateFactories(dt){S.enemyBase.cd-=dt;S.enemyTimer+=dt;if(S.enemyBase.cd<=0&&S.mode==='play'){spawnEnemy();S.enemyBase.cd=Math.max(.65,2.2-S.missionTime/80);}if(S.missionTime>40&&Math.random()<dt*.45)spawnEnemy();}
function updateBuildings(dt){for(const b of S.buildings){b.cd-=dt;if(b.type==='turret'){const t=nearestEnemy(b.x,b.y,BUILD.turret.range);if(t&&b.cd<=0){shoot(b,t,BUILD.turret.dmg,C.pink,720);b.cd=1/BUILD.turret.rate;}}}}
function updateDrones(dt){for(const d of S.drones){const spec=DRONE[d.type];moveToward(d,d.tx,d.ty,spec.speed,dt);d.cd-=dt;let baseDist=Math.hypot(d.x-S.enemyBase.x,d.y-S.enemyBase.y);if(baseDist<spec.range){if(d.cd<=0){shoot(d,S.enemyBase,spec.dmg,spec.color,650);d.cd=1/spec.rate;}continue;}const t=nearestEnemy(d.x,d.y,spec.range);if(t&&d.cd<=0){shoot(d,t,spec.dmg,spec.color,650);d.cd=1/spec.rate;}}S.drones=S.drones.filter(d=>d.hp>0);}
function updateEnemies(dt){for(const e of S.enemies){e.cd-=dt;const friendly=nearestFriendly(e.x,e.y,e.range);if(friendly){if(e.cd<=0){friendly.hp-=e.dmg;shoot(e,friendly,0,e.color,500);e.cd=1.1;S.shake=Math.max(S.shake,2);}}else{let target=S.nodes.find(n=>n.owner==='player');if(target){e.tx=target.x;e.ty=target.y;}else{e.tx=S.core.x;e.ty=S.core.y;}moveToward(e,e.tx,e.ty,e.sp,dt);}}S.enemies=S.enemies.filter(e=>{if(e.hp>0)return true;S.energy+=10;S.score+=120;S.kills++;boom(e.x,e.y,e.color,32);return false;});}
function updateShots(dt){for(let i=S.shots.length-1;i>=0;i--){const p=S.shots[i];if(!p.t||p.t.hp<=0){S.shots.splice(i,1);continue;}p.trail.push({x:p.x,y:p.y});if(p.trail.length>8)p.trail.shift();const dx=p.t.x-p.x,dy=p.t.y-p.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;if(d<14){if(p.dmg)p.t.hp-=p.dmg;boom(p.x,p.y,p.color,8);S.shots.splice(i,1);}}}
function particles(dt){for(let i=S.fx.length-1;i>=0;i--){let f=S.fx[i];f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.98;f.vy*=.98;f.l-=dt;if(f.l<=0)S.fx.splice(i,1);}}
function texts(dt){for(let i=S.texts.length-1;i>=0;i--){let t=S.texts[i];t.y-=36*dt;t.l-=dt;if(t.l<=0)S.texts.splice(i,1);}}
function draw(){ctx.save();if(S.shake)ctx.translate((Math.random()-.5)*S.shake,(Math.random()-.5)*S.shake);bg();if(S.mode!=='menu'){nodes();base();buildings();units();enemies();shots();effects();floating();preview();}if(S.mode==='menu')menu();if(S.mode==='over')end('MISSION FAILED',C.red);if(S.mode==='win')end('MISSION COMPLETE',C.green);ctx.restore();banner();drawHud();}
function bg(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#040714');g.addColorStop(1,'#03040a');ctx.fillStyle=g;ctx.fillRect(-30,-30,W+60,H+60);ctx.strokeStyle='rgba(0,217,255,.08)';for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
function nodes(){for(const n of S.nodes){ctx.save();ctx.shadowColor=n.owner==='player'?C.green:n.owner==='enemy'?C.red:C.white;ctx.shadowBlur=18;ctx.strokeStyle=ctx.shadowColor;ctx.lineWidth=4;ctx.beginPath();ctx.arc(n.x,n.y,34,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.08)';ctx.fill();ctx.restore();ctx.fillStyle=ctx.shadowColor;ctx.font='13px Arial';ctx.textAlign='center';ctx.fillText(n.owner.toUpperCase(),n.x,n.y+55);ctx.textAlign='left';}}
function base(){ctx.save();ctx.shadowColor=C.cyan;ctx.shadowBlur=25;ctx.fillStyle=C.cyan;ctx.beginPath();ctx.arc(S.core.x,S.core.y,42,0,7);ctx.fill();ctx.restore();bar(S.core.x-55,S.core.y+56,110,10,S.core.hp/S.core.max,S.core.hp>160?C.green:C.red);ctx.save();ctx.shadowColor=C.red;ctx.shadowBlur=28;ctx.fillStyle=C.red;ctx.fillRect(S.enemyBase.x-48,S.enemyBase.y-48,96,96);ctx.fillStyle=C.bg;ctx.fillRect(S.enemyBase.x-24,S.enemyBase.y-24,48,48);ctx.restore();bar(S.enemyBase.x-62,S.enemyBase.y+62,124,10,S.enemyBase.hp/S.enemyBase.max,C.red);}
function buildings(){for(const b of S.buildings){const s=BUILD[b.type];ctx.save();ctx.shadowColor=s.color;ctx.shadowBlur=18;ctx.fillStyle=s.color;if(b.type==='factory'){ctx.fillRect(b.x-32,b.y-24,64,48);ctx.fillStyle=C.bg;ctx.fillRect(b.x-14,b.y-10,28,20);}else if(b.type==='generator'){ctx.beginPath();ctx.moveTo(b.x,b.y-28);ctx.lineTo(b.x+26,b.y+22);ctx.lineTo(b.x-26,b.y+22);ctx.closePath();ctx.fill();}else{ctx.fillRect(b.x-20,b.y-20,40,40);ctx.fillStyle=C.bg;ctx.fillRect(b.x-8,b.y-8,16,16);}ctx.restore();}}
function units(){ctx.save();ctx.shadowColor=C.white;ctx.shadowBlur=18;ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(S.commander.x,S.commander.y,16,0,7);ctx.fill();ctx.strokeStyle=C.cyan;ctx.lineWidth=4;ctx.stroke();ctx.restore();bar(S.commander.x-24,S.commander.y+24,48,6,S.commander.hp/S.commander.max,C.green);for(const d of S.drones){const s=DRONE[d.type];ctx.save();ctx.shadowColor=s.color;ctx.shadowBlur=16;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(d.x,d.y,d.type==='combat'?13:10,0,7);ctx.fill();if(d.selected){ctx.strokeStyle=C.white;ctx.lineWidth=3;ctx.beginPath();ctx.arc(d.x,d.y,20,0,7);ctx.stroke();}ctx.restore();bar(d.x-20,d.y+18,40,4,d.hp/d.max,C.green);}}
function enemies(){for(const e of S.enemies){ctx.save();ctx.shadowColor=e.color;ctx.shadowBlur=16;ctx.fillStyle=e.color;ctx.fillRect(e.x-e.size,e.y-e.size,e.size*2,e.size*2);ctx.restore();bar(e.x-24,e.y-e.size-12,48,5,e.hp/e.max,e.hp>e.max*.35?C.white:C.red);}}
function shots(){for(const p of S.shots){ctx.save();ctx.strokeStyle=p.color;ctx.globalAlpha=.55;ctx.beginPath();p.trail.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.globalAlpha=1;ctx.shadowColor=p.color;ctx.shadowBlur=14;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,4,0,7);ctx.fill();ctx.restore();}}
function effects(){for(const f of S.fx){ctx.globalAlpha=Math.max(0,f.l/f.m);ctx.fillStyle=f.c;ctx.fillRect(f.x,f.y,f.z,f.z);ctx.globalAlpha=1;}}
function floating(){ctx.textAlign='center';ctx.font='800 15px Arial';for(const t of S.texts){ctx.globalAlpha=Math.max(0,t.l/t.m);ctx.fillStyle=t.c;ctx.fillText(t.t,t.x,t.y);ctx.globalAlpha=1;}ctx.textAlign='left';}
function preview(){if(S.mode!=='play')return;const s=BUILD[S.sel];if(!s)return;ctx.globalAlpha=.35;ctx.fillStyle=s.color;ctx.fillRect(S.mouse.x-20,S.mouse.y-20,40,40);ctx.globalAlpha=1;}
function bar(x,y,w,h,v,c){ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,v)),h);}
function menu(){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle=C.cyan;ctx.font='900 82px Arial';ctx.fillText('NEON',W/2,H/2-90);ctx.fillStyle=C.pink;ctx.font='900 66px Arial';ctx.fillText('COMMAND',W/2,H/2-25);ctx.fillStyle=C.white;ctx.font='20px Arial';ctx.fillText('RTS Mission: capture nodes, build drones, destroy enemy factory',W/2,H/2+35);ctx.fillText('Enter starten',W/2,H/2+80);ctx.textAlign='left';}
function end(t,c){ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle=c;ctx.font='900 62px Arial';ctx.fillText(t,W/2,H/2-35);ctx.fillStyle=C.white;ctx.font='22px Arial';ctx.fillText(`Score ${S.score} · Kills ${S.kills}`,W/2,H/2+20);ctx.fillText('R Neustart',W/2,H/2+65);ctx.textAlign='left';}
function banner(){if(S.msgT<=0||S.mode==='menu')return;ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(W/2-320,82,640,58);ctx.strokeStyle=C.cyan;ctx.strokeRect(W/2-320,82,640,58);ctx.fillStyle=C.white;ctx.font='900 24px Arial';ctx.fillText(S.msg,W/2,120);ctx.textAlign='left';}
function drawHud(){if(S.mode==='menu'){hud.innerHTML='<strong>NEON COMMAND</strong><br>Enter starten';return;}hud.innerHTML=`<div class="hud-title">NEON COMMAND RTS</div><div>Mission: <b>Destroy Enemy Factory</b></div><div>Energy <b>${Math.floor(S.energy)}</b> · Income <b>${S.income.toFixed(1)}/s</b> · Data <b>${Math.floor(S.data)}</b></div><div>Core <b>${Math.floor(S.core.hp)}</b> · Commander <b>${Math.floor(S.commander.hp)}</b> · Enemy Base <b>${Math.floor(S.enemyBase.hp)}</b></div><div>Drones <b>${S.drones.length}</b> · Enemies <b>${S.enemies.length}</b> · Kills <b>${S.kills}</b></div><hr><div class="build ${S.sel==='turret'?'active':''}">[1] Laser Turret ${BUILD.turret.cost}</div><div class="build ${S.sel==='generator'?'active':''}">[2] Generator ${BUILD.generator.cost}</div><div class="build ${S.sel==='factory'?'active':''}">[3] Drone Factory ${BUILD.factory.cost}</div><div>[Q] Scout Drone ${DRONE.scout.cost} · [E] Combat Drone ${DRONE.combat.cost}</div><div class="small">Linksklick: bauen/auswählen · Rechtsklick: bewegen/angreifen · WASD Commander</div>`;}
canvas.addEventListener('mousemove',e=>{S.mouse.x=e.clientX;S.mouse.y=e.clientY;});
canvas.addEventListener('click',()=>{if(S.mode==='menu')start();else{const hit=S.drones.some(d=>Math.hypot(d.x-S.mouse.x,d.y-S.mouse.y)<95);if(hit)selectUnits();else build(S.sel);}});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(S.mode==='play')commandMove(e.clientX,e.clientY);});
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key==='Enter'&&S.mode==='menu')start();if(e.key.toLowerCase()==='r')start();if(e.key==='1')S.sel='turret';if(e.key==='2')S.sel='generator';if(e.key==='3')S.sel='factory';if(e.key.toLowerCase()==='q')train('scout');if(e.key.toLowerCase()==='e')train('combat');});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function loop(t=0){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}fresh();addEventListener('resize',resize);resize();loop();
