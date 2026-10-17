import { darken, lighten } from '../../utils/color.js';
import { hash } from '../../utils/random.js';

function shape(c, color, points) {
  c.fillStyle = color; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.fill();
}

// Landscape sprites are rasterized once per variant by Background.
function tree(c, x, y, s, biome, t, variant = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const leaf = biome.near, tilt = (variant - 1) * 6;
  shape(c, '#25372c', [[-23,0],[-11,-9],[-7,-101],[8+tilt,-127],[16,-92],[12,-9],[28,0]]);
  shape(c, '#594832', [[-12,-3],[-5,-99],[7+tilt,-127],[10,-86],[5,-4]]);
  shape(c, '#806246', [[-3,-10],[0,-94],[6,-110],[4,-32],[2,-11]]);
  shape(c, '#35402a', [[0,-66],[-30,-96],[-39,-100],[-23,-77],[0,-51],[26,-91],[39,-104],[25,-93]]);
  const clusters = [[-5,-143,48,31],[-37,-119,37,26],[29,-126,40,29],[-12,-174,32,27],[25,-156,34,26]];
  clusters.forEach(([dx,dy,w,h], i) => {
    const xx = dx + tilt, yy = dy + hash(i + variant * 7) * 8;
    shape(c, darken(leaf,.34), [[xx-w,yy+8],[xx-w,yy-10],[xx-w+11,yy-10],[xx-w+11,yy-h],[xx+6,yy-h-7],[xx+w-9,yy-h],[xx+w-9,yy-10],[xx+w,yy-10],[xx+w,yy+12],[xx+w-13,yy+21],[xx-w+12,yy+21]]);
    shape(c, leaf, [[xx-w+5,yy-4],[xx-w+13,yy-h+4],[xx+8,yy-h-2],[xx+w-13,yy-h+5],[xx+w-4,yy-1],[xx+w-20,yy+10],[xx-w+16,yy+9]]);
    c.fillStyle = lighten(leaf,.19);
    c.fillRect(xx-w+15,yy-h+7,w*.7,6); c.fillRect(xx-w+8,yy-h+16,w*.45,5);
    c.fillStyle = lighten(leaf,.09); c.fillRect(xx+9,yy-14,16,4);
  });
  for (let k=0;k<5;k++) { c.fillStyle=k%2?'#3d764b':'#78a356'; c.fillRect(-23+k*10,-4-hash(k+variant)*4,10,4); }
  c.fillStyle=lighten(leaf,.28); c.fillRect(-37,-110,2,34+variant*7); c.fillRect(-40,-84,6,3); c.fillRect(39,-120,2,25);
  c.restore();
}

function cactus(c,x,y,s,biome,t,variant=0) {
  c.save(); c.translate(x,y); c.scale(s,s);
  const height=72+variant*12;
  shape(c,'#314e38',[[-10,0],[-10,-height+8],[-5,-height],[6,-height],[11,-height+8],[11,-36],[25,-36],[25,-60],[33,-65],[40,-60],[40,-29],[33,-22],[11,-22],[11,0]]);
  c.fillStyle='#5b8652'; c.fillRect(-6,-height+10,9,height-10); c.fillRect(28,-57,6,27);
  shape(c,'#416d41',[[-8,-26],[-29,-26],[-34,-32],[-34,-53],[-28,-59],[-22,-53],[-22,-38],[-8,-38]]);
  c.fillStyle='#99af64'; c.fillRect(-5,-height+15,2,height-20); c.fillRect(-29,-49,2,16);
  c.fillStyle='#bec58d'; for(let i=0;i<8;i++)c.fillRect(-7+(i%2)*13,-12-i*8,3,2);
  c.fillStyle='#d28c73'; c.fillRect(-5,-height-3,8,5); c.fillRect(-2,-height-6,3,3);
  shape(c,biome.near,[[27,0],[36,-9],[55,-12],[68,-5],[71,0]]);
  c.restore();
}

function crystal(c,x,y,s,biome,t,variant=0) {
  c.save(); c.translate(x,y); c.scale(s,s);
  shape(c,darken(biome.near,.25),[[-50,0],[-42,-22],[-18,-30],[4,-16],[28,-23],[44,-9],[51,0]]);
  const cols=variant%2?['#713fd0','#c290f5','#f4daff']:['#227d92','#5fd5d6','#c1fff1'];
  for(const [dx,h,angle]of[[-22,43,-.23],[0,81,.12],[23,53,.3]]) {
    c.save();c.translate(dx,-7);c.rotate(angle);
    shape(c,cols[0],[[-11,0],[-11,-h+16],[0,-h],[12,-h+17],[11,0]]);
    shape(c,cols[1],[[0,-h+2],[9,-h+17],[7,-5],[0,0]]);
    shape(c,cols[2],[[-2,-h+8],[0,-h+5],[1,-13],[-2,-8]]);c.restore();
  }
  c.fillStyle='#405f63';c.fillRect(-34,-6,18,4);c.fillRect(12,-4,22,4);c.restore();
}

function pine(c,x,y,s,biome) {
  c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='#3f5060';c.fillRect(-5,-47,10,47);
  for(let i=0;i<5;i++) {
    const yy=-23-i*25,w=45-i*8;
    shape(c,darken(biome.near,.25),[[-w,yy],[-w+7,yy-14],[-w+13,yy-14],[0,yy-46],[w-10,yy-14],[w,yy],[14,yy+6],[-17,yy+6]]);
    shape(c,'#d0e6e9',[[-w+2,yy-6],[-w+16,yy-21],[0,yy-46],[w-13,yy-16],[w-1,yy-5],[w-16,yy-7],[8,yy-17],[-4,yy-8],[-19,yy-12]]);
    shape(c,'#f4fbf5',[[-w+13,yy-14],[0,yy-46],[w-19,yy-23],[2,yy-29],[-8,yy-17]]);
  }
  c.fillStyle='#e1f1ed';c.fillRect(-18,-3,34,4);c.restore();
}

function rock(c,x,y,s) {
  c.save();c.translate(x,y);c.scale(s,s);
  shape(c,'#120f1b',[[-46,0],[-39,-23],[-24,-29],[-16,-72],[-4,-91],[12,-76],[18,-38],[35,-28],[46,0]]);
  shape(c,'#302632',[[-33,-5],[-27,-24],[-16,-26],[-11,-68],[-3,-81],[3,-40],[15,-20],[34,-12],[40,-1]]);
  shape(c,'#51404a',[[-15,-31],[-10,-64],[-4,-78],[-1,-50],[-6,-27]]);
  shape(c,'#ac442b',[[5,-59],[11,-39],[7,-24],[19,-10],[13,-4],[2,-23],[7,-38]]);
  c.fillStyle='#ffc46b';c.fillRect(8,-32,2,8);c.fillRect(14,-15,3,3);c.restore();
}
export const DECOR_DRAWERS={tree,cactus,crystal,pine,rock};
