import { hash } from '../../utils/random.js';

function poly(c,color,points){
  c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
}
function blocks(c,x,y,w,h,base,edge,seed=0){
  c.fillStyle=base;c.fillRect(x,y-h,w,h);c.fillStyle=edge;c.fillRect(x,y-h,w,4);c.fillRect(x,y-h,4,h);
  for(let yy=12;yy<h;yy+=17){c.fillStyle='#18232c33';c.fillRect(x,y-h+yy,w,2);for(let xx=yy%2?8:20;xx<w;xx+=27)c.fillRect(x+xx,y-h+yy-12,2,12);}
  c.fillStyle='#10242a44';for(let i=0;i<9;i++)c.fillRect(x+hash(i+seed)*(w-5),y-hash(i+12)*h,5,3);
}
function forest(c){
  blocks(c,-125,0,59,150,'#526a5b','#8f9b73');blocks(c,60,0,60,143,'#465e52','#7b8a67');
  blocks(c,-125,-145,245,29,'#617665','#a2ae82');
  blocks(c,-111,-172,44,19,'#617665','#a2ae82');blocks(c,65,-172,40,24,'#526a5b','#98a47a');
  poly(c,'#506754',[[-67,-142],[-67,-103],[-48,-122],[-27,-133],[27,-133],[44,-123],[61,-104],[61,-143]]);
  blocks(c,-148,4,292,13,'#3b574a','#83966b');
  c.fillStyle='#283e36';c.fillRect(-111,-121,15,26);c.fillRect(83,-112,13,24);
  c.fillStyle='#b4c788';c.fillRect(-107,-119,4,19);c.fillRect(87,-110,3,17);
  for(let i=0;i<17;i++){const x=-127+i*15,len=5+hash(i)*22;c.fillStyle=i%2?'#4c824c':'#719757';c.fillRect(x,-177,15,5);c.fillRect(x+3,-173,4,len);c.fillRect(x+7,-165+len,5,3);}
  c.fillStyle='#526f45';c.fillRect(-106,-90,4,59);c.fillRect(98,-89,3,50);
  blocks(c,-174,3,29,19,'#536c59','#97a27a');blocks(c,135,3,36,24,'#4b6554','#90a073');
}
function desert(c){
  const stone='#ae744d',light='#dfae72';
  for(const x of[-118,82]){
    blocks(c,x,0,39,115,stone,light);poly(c,light,[[x-1,-115],[x+18,-145],[x+39,-115]]);
    c.fillStyle='#805637';c.fillRect(x+13,-101,12,6);c.fillRect(x+17,-91,4,19);c.fillRect(x+11,-65,17,4);blocks(c,x-9,0,58,13,stone,light);
  }
  blocks(c,-81,0,26,77,stone,light);blocks(c,41,0,27,77,stone,light);blocks(c,-86,-74,160,17,stone,light);
  poly(c,'#d8a36b',[[-82,-90],[-38,-113],[33,-113],[71,-90]]);
  c.fillStyle='#f1c681';c.fillRect(-7,-106,12,12);c.fillStyle='#b07c46';c.fillRect(-3,-104,4,9);
  blocks(c,-52,0,26,18,'#b27d50','#dbae75');c.fillStyle='#d6a367';c.fillRect(-156,0,310,5);
  for(const[x,flip]of[[-185,1],[177,-1]]){
    poly(c,'#6c6640',[[x,0],[x+6,-40],[x+17*flip,-98],[x+23*flip,-98],[x+14,-39],[x+9,0]]);
    for(let k=0;k<5;k++){const dx=(k-2)*22;poly(c,k%2?'#52694b':'#788453',[[x+18*flip,-98],[x+dx,-113+Math.abs(k-2)*5],[x+dx*1.5,-81+Math.abs(k-2)*5],[x+dx*.7,-97]]);}
  }
}
function cave(c){
  poly(c,'#243349',[[-220,0],[-203,-109],[-163,-190],[-113,-207],[-90,-158],[-88,-19],[-57,0]]);
  poly(c,'#344257',[[-202,-4],[-188,-110],[-157,-179],[-145,-99],[-158,-31],[-139,0]]);
  poly(c,'#202d42',[[105,0],[116,-122],[157,-203],[198,-173],[219,-51],[235,0]]);
  poly(c,'#35475c',[[120,-3],[136,-112],[157,-187],[170,-146],[153,-83],[161,-7]]);
  poly(c,'#304258',[[-146,-169],[-135,-207],[-87,-222],[56,-211],[164,-180],[150,-151],[62,-170],[-64,-179]]);
  for(const[x,y,h]of[[-157,-155,75],[154,-142,91],[23,-182,177]]){c.fillStyle='#6ce8d06b';c.fillRect(x,y,5,h);c.fillStyle='#beffdf88';c.fillRect(x+1,y,2,h*.7);}
  for(let i=0;i<7;i++){const x=-81+i*27,h=8+hash(i)*28;poly(c,'#51788c',[[x-5,-174],[x,-174+h],[x+5,-174]]);}
  c.fillStyle='#4eb7bb66';c.fillRect(-49,-3,139,5);
}
function tundra(c){
  blocks(c,-137,0,66,141,'#6b8a9b','#c4d9d9');blocks(c,74,0,60,170,'#637e93','#bbd4d8');
  for(const x of[-137,-113,-90])blocks(c,x,-141,17,19,'#839eaa','#e3ece5');
  for(const x of[74,96,117])blocks(c,x,-170,17,19,'#839eaa','#e3ece5');
  blocks(c,-74,-81,151,27,'#728fa1','#d5e6e6');
  poly(c,'#506e89',[[-74,-83],[-74,-55],[-47,-78],[44,-78],[77,-54],[77,-84]]);
  c.fillStyle='#2c4d69';c.fillRect(-117,-117,18,27);c.fillRect(91,-141,18,28);
  c.fillStyle='#9adce3';c.fillRect(-113,-114,5,19);c.fillRect(95,-138,5,19);
  c.fillStyle='#ecf4e9';c.fillRect(-140,-145,74,6);c.fillRect(69,-174,70,7);c.fillRect(-77,-109,156,5);
  for(let i=0;i<12;i++){const x=-71+i*12,len=7+hash(i)*19;poly(c,'#c5e9ea',[[x,-104],[x+3,-104+len],[x+6,-104]]);}
  c.fillStyle='#6d8291';c.fillRect(105,-211,3,35);poly(c,'#567ba4',[[108,-211],[143,-205],[137,-195],[145,-189],[108,-195]]);
  c.fillStyle='#ecf4e9';c.fillRect(-162,-2,320,6);
}
function volcano(c){
  for(const[x,flip]of[[-110,1],[104,-1]]){
    poly(c,'#1a1724',[[x-38,0],[x-28,-87],[x-42*flip,-153],[x-14*flip,-195],[x+11*flip,-161],[x+22,-86],[x+33,0]]);
    poly(c,'#47303a',[[x-26,-8],[x-17,-87],[x-24*flip,-150],[x-13*flip,-179],[x-4,-124],[x+8,-77],[x+16,-10]]);
    poly(c,'#bf5739',[[x-6,-143],[x+6,-113],[x-1,-90],[x+13,-66],[x+9,-36],[x+2,-62],[x-9,-87],[x-2,-113]]);
    c.fillStyle='#ffd18a';c.fillRect(x+1,-105,3,11);c.fillRect(x+6,-64,3,13);
  }
  poly(c,'#33232d',[[-105,-139],[-84,-178],[-45,-190],[0,-180],[43,-189],[83,-177],[109,-141],[78,-139],[41,-162],[-39,-161],[-79,-139]]);
  poly(c,'#8d4239',[[-68,-173],[-42,-180],[-10,-171],[12,-171],[43,-180],[69,-171],[41,-174],[9,-165],[-11,-165],[-41,-174]]);
  c.fillStyle='#ef8b51';c.fillRect(-5,-177,10,15);blocks(c,-150,3,302,12,'#281d28','#744139');
}
export const LANDMARK_DRAWERS={forest,desert,cave,tundra,volcano};
