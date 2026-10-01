const assert=require('node:assert/strict');
const c=require('../dist/core.js');
const samples=['CS3FWPJxv2MzhdGLjqmiopSnQxH9aLGNtTf5nkNLEYCfAd','CSnrWaoboZNbyxeozF9GTnG3kfQxpP2CpzCKOiMztS724T'];
for(const code of samples)assert.equal(c.encode(c.decode(code)),code);
assert.equal(c.decode(samples[0]).outline,1);assert.equal(c.decode(samples[0]).thickness,3);assert.equal(c.decode(samples[1]).gap,1);
const extreme={...c.defaults,style:9,recoil:1,dot:1,t:1,reference:4320,thickness:32,gap:-3840,length:255,outline:2,r:0,g:255,b:173,a:29,or:97,og:128,ob:2,oa:163,spread:255,split:127,inner:.45,outer:.72,ratio:.38,scopeColor:1,scopeScale:2};
assert.deepEqual(c.decode(c.encode(extreme)),extreme);
assert.deepEqual(c.importText(c.consoleLine(extreme)).state,extreme);
assert.deepEqual(c.importText(c.consoleLine(extreme,true)).state,extreme);
assert.equal(c.importText('"cl_crosshair_length" "4"\n"cl_crosshair_thickness" "3"\n"cl_crosshair_screen_height" "1440"').state.reference,1440);
assert.equal(c.importText('bind x quit; cl_crosshair_length 7; echo malicious').state.length,7);
assert.equal(c.importText('bind x quit; cl_crosshair_length 7; echo malicious').warnings.length,1);
assert.throws(()=>c.decode(samples[0].slice(0,-1)+'A'));
assert.throws(()=>c.validate({gap:3841}));assert.throws(()=>c.validate({inner:.005}));assert.throws(()=>c.importText('quit'));
for(const style of [0,1,2,3,4,5,6,7,8,9])for(const reference of [480,960,1080,1440,2160])for(const gap of [-128,0,1,128]){
 const s={...c.defaults,style,reference,gap};assert.equal(c.decode(c.encode(s)).gap,gap);const g=c.geometry(s,1440,.5);assert.ok(g.length>0||s.ratio===0);assert.ok(g.every(x=>Object.values(x).every(v=>typeof v!=='number'||Number.isFinite(v))));
}
console.log('PASS: 2 real CS2 samples; 200 style/resolution/gap cases; extreme payload; console and VCFG import; corruption and invalid input.');

// Explicit new commands take precedence over hidden legacy values in VCFG.
for(const input of ['cl_crosshairsize 99; cl_crosshair_length 2','cl_crosshair_length 2; cl_crosshairsize 99']) {
 const result=c.importText(input);assert.equal(result.state.length,2);assert.deepEqual(result.warnings,[]);
}
// Tile coverage must not omit a visible pixel or leave the selected frame.
for(const [width,height] of [[640,480],[1280,960],[1281,961],[1920,1080],[3440,1440],[7680,4320],[16384,16384]])for(const thickness of [1,2,3,4,31,32])for(const gap of [-5,0,1,3840]) {
 const state={...c.defaults,thickness,gap,outline:1,dot:1};
 const raster=c.pixelTiles(state,width,height);
 assert.deepEqual(raster.anchor,[Math.floor(width/2),Math.floor(height/2)]);
 assert.ok(raster.tiles.every(t=>t.x>=0&&t.y>=0&&t.w<=256&&t.h<=256&&t.x+t.w<=width&&t.y+t.h<=height));
 for(const s of c.geometry(state,height))if(s.type==='rect')for(const [px,py] of [[s.x,s.y],[s.x+s.w-1,s.y+s.h-1]]) {
  const x=px+raster.anchor[0],y=py+raster.anchor[1];
  if(x>=0&&x<width&&y>=0&&y<height)assert.ok(raster.tiles.some(t=>x>=t.x&&x<t.x+t.w&&y>=t.y&&y<t.y+t.h));
 }
}
console.log('PASS: legacy precedence; raster anchor, clipping and coverage across 168 even/odd and up-to-16K cases. Native CS2 parity remains unverified.');
