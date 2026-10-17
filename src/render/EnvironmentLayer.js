import { GROUND_Y, GAME_HEIGHT } from '../config/constants.js';
import { darken, lighten, withAlpha } from '../utils/color.js';
import { hash } from '../utils/random.js';
import { DECOR_DRAWERS } from './sprites/DecorSprites.js';
import { LANDMARK_DRAWERS } from './sprites/LandmarkSprites.js';

function polygon(c, color, points) {
  c.fillStyle=color;c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
}
const PALETTES = {
  forest: {water:'#468b81',shine:'#9cc7a0',stone:'#9a9e7c',flower:'#f0c582'},
  desert: {water:'#679b86',shine:'#dfcaa0',stone:'#bd905f',flower:'#d88379'},
  cave: {water:'#294d62',shine:'#71c5cd',stone:'#4d546b',flower:'#8ce0db'},
  tundra: {water:'#699eb5',shine:'#d4f1eb',stone:'#9ebcce',flower:'#e0f8ef'},
  volcano: {water:'#9a3c2a',shine:'#ffb260',stone:'#57404a',flower:'#ea7949'},
};

/** Cached scenery tiles plus lightweight animated water and light. */
export class EnvironmentLayer {
  constructor() { this.cache=new Map(); }

  cached(key,w,h,draw) {
    if(!this.cache.has(key)) {
      const canvas=document.createElement('canvas');
      // One art pixel represents two logical pixels, just like the world renderer.
      canvas.width=Math.ceil(w/2);canvas.height=Math.ceil(h/2);
      const c=canvas.getContext('2d');c.scale(.5,.5);draw(c);
      this.cache.set(key,canvas);
    }
    return this.cache.get(key);
  }

  decor(c,biome,distance,width,layer='near') {
    const far=layer==='far',middle=layer==='middle';
    const spacing=far?102:middle?198:328;
    const offset=distance*(far?.18:middle?.43:.72);
    const scale=far?.52:middle?.80:1.05;
    const base=GROUND_Y-(far?40:middle?15:0);
    const start=Math.floor(offset/spacing)-2;
    for(let i=start;i<start+width/spacing+5;i++) {
      if(!far&&hash(i+21)<(middle?.24:.38))continue;
      const variant=Math.floor(hash(i*3+17)*3);
      const palette=far?{...biome,near:biome.far}:middle?{...biome,near:biome.mid}:biome;
      const tile=this.cached('decor-'+biome.id+'-'+layer+'-'+variant,220,240,(g)=>DECOR_DRAWERS[biome.decor](g,110,230,1,palette,variant,variant));
      const s=scale*(.82+hash(i*11+9)*.28);
      const x=i*spacing-offset+hash(i+93)*spacing*.5;
      c.drawImage(tile,Math.round(x-110*s),Math.round(base-230*s),220*s,240*s);
    }
  }

  landmarks(c,biome,distance,width) {
    const spacing=1060,offset=distance*.28,start=Math.floor((offset-680)/spacing)-1;
    const tile=this.cached('landmark-'+biome.id,560,280,(g)=>{g.translate(280,260);LANDMARK_DRAWERS[biome.id](g);});
    for(let i=start;i<start+width/spacing+3;i++) {
      const x=i*spacing+680-offset;
      if(x<-320||x>width+320)continue;
      const scale=.80+hash(i+6)*.14;
      c.drawImage(tile,Math.round(x-280*scale),Math.round(GROUND_Y-22-260*scale),560*scale,280*scale);
    }
  }

  water(c,biome,distance,width,time) {
    const p=PALETTES[biome.id],top=GROUND_Y-54;
    const color=biome.id==='desert'?withAlpha(p.water,.48):p.water;
    polygon(c,color,[[0,top+12],[width*.20,top+4],[width*.45,top+12],[width*.65,top],[width,top+8],[width,GROUND_Y-9],[0,GROUND_Y-9]]);
    c.fillStyle=withAlpha(p.shine,biome.id==='volcano'?.45:.24);
    for(let i=0;i<Math.ceil(width/47)+3;i++) {
      const x=((i*47-distance*.2+time*(biome.id==='volcano'?6:12))%(width+80)+width+80)%(width+80)-40;
      const y=top+17+hash(i+11)*24;
      c.fillRect(Math.round(x),Math.round(y),12+hash(i+20)*34,2);
    }
    c.fillStyle=biome.id==='volcano'?'#422934':biome.mid;
    for(let i=-1;i<width/135+2;i++) {
      const x=i*135-(distance*.31%135);
      c.fillRect(x,GROUND_Y-13-hash(i+2)*7,77,12);
    }
    if(biome.id==='cave'||biome.id==='volcano') {
      const glow=c.createLinearGradient(0,top-8,0,GROUND_Y);
      glow.addColorStop(0,withAlpha(p.shine,0));glow.addColorStop(1,withAlpha(p.shine,.10+Math.sin(time*.8)*.025));
      c.fillStyle=glow;c.fillRect(0,top-8,width,62);
    }
  }

  distant(c,biome,distance,width,time) {
    const spacing=780,offset=distance*.105,start=Math.floor(offset/spacing)-1;
    for(let i=start;i<start+width/spacing+3;i++) {
      const x=i*spacing+430-offset;
      if(biome.id==='desert') {
        polygon(c,'#bd8a63',[[x-167,260],[x-9,111],[x+154,260]]);
        polygon(c,'#d7a875',[[x-9,111],[x+154,260],[x+34,260]]);
        c.fillStyle='#e2b98788';
        for(let k=0;k<7;k++)c.fillRect(x-94+k*13,211-k*13,37+k*5,2);
        polygon(c,'#d4a376',[[x+132,269],[x+215,174],[x+315,269]]);
      } else if(biome.id==='tundra') {
        polygon(c,'#7396b5',[[x-240,270],[x-92,80],[x-35,162],[x+46,104],[x+226,270]]);
        polygon(c,'#d7e8e7',[[x-157,164],[x-92,80],[x-35,162],[x-68,145],[x-82,159],[x-103,134],[x-126,170]]);
        polygon(c,'#eef6ec',[[x+4,148],[x+46,104],[x+99,158],[x+64,147],[x+45,155],[x+29,138]]);
        polygon(c,'#a8c8d6',[[x-90,91],[x-73,202],[x-18,248],[x-38,163]]);
      } else if(biome.id==='volcano') {
        polygon(c,'#6a3334',[[x-228,276],[x-74,137],[x-32,99],[x+30,99],[x+70,139],[x+240,276]]);
        polygon(c,'#482a32',[[x-32,99],[x+30,99],[x+70,139],[x+240,276],[x+18,264]]);
        polygon(c,'#dd6745',[[x-32,99],[x-15,110],[x+11,110],[x+30,99],[x+16,119],[x-11,118]]);
        polygon(c,'#c7583b',[[x-9,117],[x-22,157],[x+10,192],[x-1,228],[x+13,263],[x+30,263],[x+17,225],[x+23,191],[x-8,153],[x+3,119]]);
        for(let k=0;k<6;k++) {
          const yy=84-k*17,drift=Math.sin(time*.22+k*.8)*9-k*7,sw=22+k*8;
          polygon(c,withAlpha('#a56c65',.18-k*.018),[[x+drift-sw,yy+9],[x+drift-sw-7,yy-3],[x+drift-sw+4,yy-13],[x+drift-9,yy-18],[x+drift+sw-2,yy-14],[x+drift+sw+9,yy-3],[x+drift+sw,yy+9]]);
        }
      } else if(biome.id==='forest') {
        // A waterfall and an old viaduct tucked into the distant valley.
        c.fillStyle='#9acbbb';c.fillRect(x-23,182,12,92);c.fillStyle='#d4e8c6';c.fillRect(x-21,184,3,86);
        c.fillStyle='#708b77';c.fillRect(x-96,216,179,12);
        for(let k=0;k<5;k++){c.fillRect(x-96+k*37,225,12,42);c.fillRect(x-98+k*37,212,16,5);}
        c.fillStyle='#9da482';c.fillRect(x-98,214,183,3);
      } else {
        polygon(c,'#253c50',[[x-210,280],[x-176,170],[x-117,114],[x-96,249],[x-51,280]]);
        polygon(c,'#24354e',[[x+56,280],[x+103,126],[x+159,170],[x+195,280]]);
        c.fillStyle='#5d9fa64d';c.fillRect(x+113,161,4,94);
      }
    }
  }

  aurora(c,width,time) {
    for(let band=0;band<3;band++) {
      const g=c.createLinearGradient(0,22,0,177);
      g.addColorStop(0,'#8be5d300');g.addColorStop(.5,band%2?'#b9a1e85c':'#74e4c96e');g.addColorStop(1,'#9ad6db00');
      c.fillStyle=g;c.beginPath();
      for(let x=-4;x<=width+8;x+=12){const y=48+band*19+Math.sin(x*.005+time*.14+band)*24+Math.sin(x*.012+band)*8;if(x===-4)c.moveTo(x,y);else c.lineTo(x,y);}
      for(let x=width+8;x>=-4;x-=12){const y=127+band*10+Math.sin(x*.005+time*.14+band)*29;c.lineTo(x,y);}
      c.closePath();c.fill();
    }
  }

  ground(c,biome,distance,width) {
    const tw=768,th=GAME_HEIGHT-GROUND_Y+10;
    const tile=this.cached('ground-'+biome.id,tw,th,(g)=>{
      const p=PALETTES[biome.id];
      g.fillStyle=biome.ground;g.fillRect(0,0,tw,th);
      g.fillStyle=darken(biome.ground,.24);g.fillRect(0,37,tw,th-37);
      g.fillStyle=darken(biome.ground,.40);g.fillRect(0,62,tw,th-62);
      // Irregular rock strata and soil flecks; no repeating horizontal stripes.
      for(let i=0;i<83;i++){
        const x=hash(i+20)*tw,y=20+hash(i+41)*51,w=6+hash(i+3)*24;
        g.fillStyle=i%3===0?lighten(biome.ground,.17):darken(biome.ground,.20);
        g.fillRect(x,y,w,3+hash(i+11)*6);
        if(i%4===0){g.fillStyle=darken(biome.ground,.36);g.fillRect(x+2,y+5,w*.7,2);}
      }
      if(biome.id==='forest') {
        g.strokeStyle='#3f3529';g.lineWidth=2;
        for(let i=0;i<11;i++){const x=i*77+12;g.beginPath();g.moveTo(x,10);g.lineTo(x+9,26);g.lineTo(x+5,40);g.lineTo(x+20,50);g.stroke();}
      }
      if(biome.id==='volcano') {
        for(let i=0;i<13;i++){
          const x=i*61+hash(i)*15,y=28+hash(i+2)*25;
          polygon(g,'#9b3a31',[[x,y],[x+12,y-4],[x+21,y+10],[x+35,y+8],[x+42,y+13],[x+19,y+15],[x+9,y+1]]);
          g.fillStyle='#f4a04c';g.fillRect(x+16,y+6,4,4);
        }
      }
      // Setts follow the path; their varied widths keep it from looking like a UI grid.
      g.fillStyle=biome.path;g.fillRect(0,6,tw,16);
      for(let i=0;i<35;i++){
        const x=i*23+hash(i+6)*5,y=8+(i%2)*7;
        g.fillStyle=i%3===0?lighten(biome.path,.23):darken(biome.path,.08);g.fillRect(x,y,15+hash(i)*8,5);
        g.fillStyle=withAlpha(p.stone,.38);g.fillRect(x,y,12,1);
      }
      g.fillStyle=darken(biome.groundTop,.26);g.fillRect(0,2,tw,5);
      g.fillStyle=biome.groundTop;g.fillRect(0,0,tw,5);
      for(let i=0;i<96;i++){
        const x=i*8;
        g.fillStyle=i%3===0?lighten(biome.groundTop,.20):darken(biome.groundTop,.14);
        g.fillRect(x,hash(i+13)*4,6,2);
        if(hash(i+8)>.45){g.fillStyle=darken(biome.groundTop,.23);g.fillRect(x+2,5,4,3+hash(i+1)*6);}
      }
    });
    const off=((distance%tw)+tw)%tw;
    for(let x=-off;x<width;x+=tw)c.drawImage(tile,Math.round(x),GROUND_Y-3,tw,th);
  }

  verge(c,biome,distance,width) {
    const spacing=51,offset=distance,start=Math.floor(offset/spacing)-2,p=PALETTES[biome.id];
    for(let i=start;i<start+width/spacing+4;i++){
      const x=Math.round(i*spacing-offset+hash(i+3)*20),n=hash(i+9),y=GROUND_Y-3;
      if(biome.id==='forest'){
        c.fillStyle='#305d3e';c.fillRect(x,y-9,2,9);c.fillRect(x+5,y-6,2,6);c.fillRect(x-4,y-5,2,5);
        c.fillStyle='#86af61';c.fillRect(x+1,y-9,2,5);
        if(n>.60){c.fillStyle='#dbc7a0';c.fillRect(x+13,y-7,2,7);c.fillStyle=n>.85?'#b34c44':'#dfb66c';c.fillRect(x+9,y-10,10,4);c.fillStyle='#f1d9a0';c.fillRect(x+11,y-10,2,2);}
        else if(n<.26){c.fillStyle=p.flower;c.fillRect(x+9,y-10,3,3);c.fillRect(x+6,y-7,3,3);c.fillStyle='#688e52';c.fillRect(x+9,y-5,2,6);}
      } else if(biome.id==='desert'){
        polygon(c,'#b18b58',[[x,y],[x+5,y-5],[x+14,y-7],[x+20,y]]);c.fillStyle='#e9c487';c.fillRect(x+6,y-6,7,2);
        if(n>.72){c.fillStyle='#786e46';c.fillRect(x+25,y-11,2,11);c.fillRect(x+21,y-8,5,2);c.fillRect(x+27,y-6,5,2);}
      } else if(biome.id==='cave'){
        if(n>.38){polygon(c,n>.75?'#a685d0':'#5db2bd',[[x,y],[x+3,y-12-n*8],[x+7,y-6],[x+9,y-16],[x+14,y]]);c.fillStyle='#c2e9d9';c.fillRect(x+4,y-10,2,6);}
        else {c.fillStyle='#3e6975';c.fillRect(x,y-4,12,4);}
      } else if(biome.id==='tundra'){
        polygon(c,'#b4d3dd',[[x-5,y],[x+3,y-8],[x+19,y-6],[x+26,y]]);c.fillStyle='#f3f8e9';c.fillRect(x+2,y-7,15,3);
        if(n>.7){c.fillStyle='#6f939f';c.fillRect(x+20,y-16,2,16);c.fillRect(x+16,y-12,4,2);}
      } else {
        polygon(c,'#392a34',[[x,y],[x+3,y-13],[x+10,y-18],[x+15,y-7],[x+24,y]]);c.fillStyle='#a84b37';c.fillRect(x+6,y-12,2,8);
        if(n>.6){c.fillStyle='#ef9d58';c.fillRect(x+7,y-9,2,3);}
      }
    }
    // Occasional route lanterns connect the landscapes to the hero's journey.
    const signSpacing=690,signOffset=distance*.85,first=Math.floor(signOffset/signSpacing)-1;
    for(let i=first;i<first+width/signSpacing+3;i++){
      const x=i*signSpacing+270-signOffset;
      c.fillStyle=biome.id==='tundra'?'#5c7784':'#554535';c.fillRect(x,GROUND_Y-44,4,42);c.fillRect(x-14,GROUND_Y-44,21,4);
      c.fillStyle='#2b3432';c.fillRect(x-14,GROUND_Y-39,11,14);
      c.fillStyle=biome.id==='cave'?'#82dbcf':biome.id==='volcano'?'#f3a26d':'#e4c785';c.fillRect(x-12,GROUND_Y-36,7,8);
      c.fillStyle='#c3ab75';c.fillRect(x-13,GROUND_Y-40,9,2);
    }
  }

  motes(c,biome,width,time,distance) {
    if(biome.id!=='forest'&&biome.id!=='cave')return;
    for(let i=0;i<14;i++){
      const x=((hash(i+5)*width-distance*.36+Math.sin(time*.5+i)*24)%width+width)%width;
      const y=166+hash(i+16)*140+Math.sin(time*.7+i)*9;
      const alpha=.25+.40*Math.sin(time*1.2+i)**2;
      c.fillStyle=withAlpha(biome.id==='forest'?'#eee8a6':'#8ce8de',alpha*.16);c.fillRect(x-3,y-3,8,8);
      c.fillStyle=withAlpha(biome.id==='forest'?'#f4edb5':'#a0f2e7',alpha);c.fillRect(x,y,2,2);
    }
  }
}
