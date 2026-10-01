/* CS2 1.41.8.8 / client 2000922. New CS codes: 32-byte payload,
 * base 57 least-significant digit first, 44 digits. Verified against the
 * installed client.dll serializer at RVA 0xDAD590 and user-provided samples.
 * Preview geometry is a browser approximation pending game pixel calibration.
 */
(function(root){
'use strict';
const alphabet='ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';
const styles=['Dynamic Cross','Dynamic Circle','Classic Dynamic Cross','Static Circle','Static Cross','Static Cross — Shot Feedback','Dot Only','Dynamic Quad','Static Square','Static Quad'];
const defaults={style:4,recoil:0,dot:0,t:0,r:50,g:250,b:50,a:255,or:255,og:0,ob:0,oa:255,outline:0,thickness:2,gap:1,length:2,spread:227,split:3,inner:0,outer:1,ratio:1,scopeColor:0,scopeScale:1,reference:960};
const specs={style:[0,9,1],recoil:[0,1,1],dot:[0,1,1],t:[0,1,1],r:[0,255,1],g:[0,255,1],b:[0,255,1],a:[0,255,1],or:[0,255,1],og:[0,255,1],ob:[0,255,1],oa:[0,255,1],outline:[0,2,1],thickness:[0,32,1],gap:[-3840,3840,1],length:[0,255,1],spread:[0,255,1],split:[0,127,1],inner:[0,1,.01],outer:[.3,1,.01],ratio:[0,1,.01],scopeColor:[0,1,1],scopeScale:[.1,2,.01],reference:[240,65535,1]};
const commands={style:'cl_crosshairstyle',recoil:'cl_crosshair_recoil',dot:'cl_crosshairdot',t:'cl_crosshair_t',r:'cl_crosshaircolor_r',g:'cl_crosshaircolor_g',b:'cl_crosshaircolor_b',a:'cl_crosshaircolor_a',or:'cl_crosshairoutline_r',og:'cl_crosshairoutline_g',ob:'cl_crosshairoutline_b',oa:'cl_crosshairoutline_a',outline:'cl_crosshair_drawoutline',thickness:'cl_crosshair_thickness',gap:'cl_crosshair_gap',length:'cl_crosshair_length',spread:'cl_crosshair_dynamic_spread_limit',split:'cl_crosshair_dynamic_splitdist',inner:'cl_crosshair_dynamic_splitalpha_innermod',outer:'cl_crosshair_dynamic_splitalpha_outermod',ratio:'cl_crosshair_dynamic_maxdist_splitratio',scopeColor:'cl_ironsight_usecrosshaircolor',scopeScale:'cl_ironsight_dot_scale',reference:'cl_crosshair_screen_height'};
function validate(input,base=defaults){
 const out={...base};
 for(const [key,value] of Object.entries(input)){
  if(!(key in specs))throw new Error('Unknown parameter: '+key);
  const n=Number(value),[min,max,step]=specs[key];
  if(!Number.isFinite(n)||n<min||n>max||Math.abs(n/step-Math.round(n/step))>1e-6)throw new Error('Invalid value: '+key);
  out[key]=n;
 }
 return out;
}
function encode(input){
 const s=validate(input),d=new Uint8Array(32),view=new DataView(d.buffer);
 d[1]=1;view.setUint16(2,s.reference,true);d[4]=s.style|(s.recoil<<5)|(s.dot<<6)|(s.t<<7);
 d.set([s.r,s.g,s.b,s.a,s.or,s.og,s.ob,s.oa],5);d[13]=s.thickness|(s.outline<<6);
 view.setInt16(14,s.gap,true);d[16]=s.length;d[17]=s.spread;
 view.setUint32(18,s.split|(Math.round(s.inner*100)<<7)|(Math.round((s.outer-.3)*100)<<14)|(Math.round(s.ratio*100)<<21)|(s.scopeColor<<28),true);
 d[22]=Math.round((s.scopeScale-.1)*100);
 d[0]=d.slice(1).reduce((sum,n)=>sum+n,0)&255;
 let n=0n;for(const x of d)n=(n<<8n)|BigInt(x);
 let code='CS';for(let i=0;i<44;i++){code+=alphabet[Number(n%57n)];n/=57n;}return code;
}
function decode(code){
 code=code.trim();if(!/^CS[A-Za-z2-9]{44}$/.test(code))throw new Error('Expected a current CS code (46 characters). Legacy CSGO codes are not supported.');
 let n=0n;for(const c of code.slice(2).split('').reverse()){const k=alphabet.indexOf(c);if(k<0)throw new Error('Invalid character in share code.');n=n*57n+BigInt(k);}
 if(n>=1n<<256n)throw new Error('Code is too long.');
 const d=new Uint8Array(32);for(let i=31;i>=0;i--){d[i]=Number(n&255n);n>>=8n;}
 if((d.slice(1).reduce((s,x)=>s+x,0)&255)!==d[0])throw new Error('Damaged code: checksum mismatch.');
 if(d[1]!==1||d.slice(23).some(x=>x!==0))throw new Error('Unsupported share code version.');
 const v=new DataView(d.buffer),p=v.getUint32(18,true);
 return validate({reference:v.getUint16(2,true),style:d[4]&31,recoil:(d[4]>>5)&1,dot:(d[4]>>6)&1,t:d[4]>>7,r:d[5],g:d[6],b:d[7],a:d[8],or:d[9],og:d[10],ob:d[11],oa:d[12],thickness:d[13]&63,outline:d[13]>>6,gap:v.getInt16(14,true),length:d[16],spread:d[17],split:p&127,inner:((p>>7)&127)/100,outer:Number((.3+((p>>14)&127)/100).toFixed(2)),ratio:((p>>21)&127)/100,scopeColor:(p>>28)&1,scopeScale:Number((.1+d[22]/100).toFixed(2))});
}
function consoleLine(s,multiline=false){return Object.entries(commands).map(([k,c])=>`${c} "${s[k]}"`).join(multiline?'\n':'; ');}
function importText(text,height=960){
 const value=text.trim();if(value.startsWith('CS')&&!value.startsWith('CSGO'))return {state:decode(value),warnings:[]};
 const reverse=Object.fromEntries(Object.entries(commands).map(([k,v])=>[v,k])),values={},warnings=[];
 const clean=value.replace(/\/\/[^\n\r]*/g,''),legacyValues={};let count=0;
 for(const statement of clean.split(/[;\n\r]+/)){
  const m=statement.trim().match(/^"?([a-zA-Z_0-9]+)"?\s+"?([^"\s]+)"?\s*$/);if(!m){if(statement.trim()&&!['{','}'].includes(statement.trim()))count++;continue;}
  let [_,name,raw]=m,n=raw==='true'?1:raw==='false'?0:Number(raw);
  let key=reverse[name];
  if(!key&&['cl_crosshairsize','cl_crosshairthickness','cl_crosshairgap','cl_crosshairalpha'].includes(name)){
   key={cl_crosshairsize:'length',cl_crosshairthickness:'thickness',cl_crosshairgap:'gap',cl_crosshairalpha:'a'}[name];
   if(key!=='a')n=Math.round(n*height/480);
   legacyValues[key]=n;continue;
  }
  if(key){values[key]=n;}else count++;
 }
 let legacy=false;for(const [key,n] of Object.entries(legacyValues))if(!(key in values)){values[key]=n;if(key!=='a')legacy=true;}
 if(!Object.keys(values).length)throw new Error('No crosshair settings found. Paste a current CS code or console commands.');
 if(!('reference' in values))values.reference=height;
 if(legacy)warnings.push('Legacy dimensions were converted approximately. Check the result in game.');
 if(count)warnings.push(`${count} non-crosshair command(s) ignored.`);
 return {state:validate(values),warnings};
}
function geometry(s,height,motion=0){
 const scale=height/s.reference,t=Math.max(1,Math.round(s.thickness*scale)),l=Math.round(s.length*scale),gap=Math.round(s.gap*scale);
 let distance=gap;
 if([0,1,7].includes(s.style))distance+=Math.round(motion*Math.min(128+s.spread,128)*scale);
 if([2,5].includes(s.style))distance+=Math.round(motion*12*scale);
 const shapes=[],rect=(x,y,w,h,alpha=1)=>{if(w>0&&h>0)shapes.push({type:'rect',x,y,w,h,alpha});};
 const low=-Math.floor(t/2),high=low+t;
 const arms=(start,length,alpha)=>{
  rect(high+start,low,length,t,alpha);rect(low-start-length,low,length,t,alpha);
  rect(low,high+start,t,length,alpha);if(!s.t)rect(low,low-start-length,t,length,alpha);
 };
 if([0,2,4,5].includes(s.style)){
  if(s.style===2&&motion>0&&distance>s.split*scale){arms(Math.round(s.split*scale),Math.round(l*(1-s.ratio)),s.inner);arms(distance,Math.round(l*s.ratio),s.outer);}else arms(distance,l,1);
 }else if([1,3].includes(s.style)){shapes.push({type:'circle',radius:Math.max(t/2,Math.abs(distance)+t/2),thickness:t,alpha:1});}
 else if(s.style===8){const r=Math.max(0,Math.abs(distance));rect(-r-t,-r-t,2*r+2*t,t);rect(-r-t,r,2*r+2*t,t);rect(-r-t,-r,t,2*r);rect(r,-r,t,2*r);}
 else if([7,9].includes(s.style)){
  const r=Math.max(t,Math.abs(distance)+t),arm=Math.max(t,Math.round((s.style===9?Math.abs(distance)+t:l)*(s.style===9?s.ratio:1)));
  for(const sx of [-1,1])for(const sy of [-1,1]){if(s.t&&sy===-1)continue;const x=sx===1?r:r*-1-t,y=sy===1?r:r*-1-t;rect(sx===1?x:x-arm+t,y,arm,t);rect(x,sy===1?y:y-arm+t,t,arm);}
 }
 if(s.dot||s.style===6)rect(low,low,t,t);
 return shapes;
}
// Rasterize in game pixels first. Both preview and loupe reuse these tiles.
// An integer raster anchor is provisional until compared with native CS2 frames.
function pixelTiles(s,width,height,motion=0,recoil=0,size=256){
 const anchor=[Math.floor(width/2),Math.floor(height/2-recoil)],tiles=new Map();
 for(const shape of geometry(s,height,motion)){
  const pad=s.outline?2:0;
  const r=shape.type==='circle'?shape.radius+shape.thickness/2+pad:0;
  const left=Math.max(0,Math.floor(anchor[0]+(shape.type==='circle'?-r:shape.x-pad)));
  const top=Math.max(0,Math.floor(anchor[1]+(shape.type==='circle'?-r:shape.y-pad)));
  const right=Math.min(width,Math.ceil(anchor[0]+(shape.type==='circle'?r:shape.x+shape.w+pad)));
  const bottom=Math.min(height,Math.ceil(anchor[1]+(shape.type==='circle'?r:shape.y+shape.h+pad)));
  if(right<=left||bottom<=top)continue;
  for(let y=Math.floor(top/size)*size;y<bottom;y+=size)for(let x=Math.floor(left/size)*size;x<right;x+=size){
   if(shape.type==='circle'){
    const dx=Math.max(x-anchor[0],0,anchor[0]-x-size),dy=Math.max(y-anchor[1],0,anchor[1]-y-size);
    const nearest=Math.hypot(dx,dy),farthest=Math.max(...[[x,y],[x+size,y],[x,y+size],[x+size,y+size]].map(p=>Math.hypot(p[0]-anchor[0],p[1]-anchor[1])));
    if(nearest>r||farthest<shape.radius-shape.thickness/2-pad)continue;
   }
   tiles.set(`${x},${y}`,{x,y,w:Math.min(size,width-x),h:Math.min(size,height-y)});
  }
 }
 return {anchor,tiles:[...tiles.values()]};
}
let outlineLayer;
function draw(ctx,s,{height=s.reference,cx=0,cy=0,sx=1,sy=1,motion=0}={}){
 ctx.save();ctx.translate(cx,cy);ctx.scale(sx,sy);ctx.imageSmoothingEnabled=false;
 const shapes=geometry(s,height,motion),color=`rgba(${s.r},${s.g},${s.b},${s.a/255})`,border=`rgba(${s.or},${s.og},${s.ob},${s.oa/255})`;
 // Union the bars before compositing: intersections must not accumulate alpha.
 if(s.outline){
  outlineLayer??=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1,1):document.createElement('canvas');outlineLayer.width=ctx.canvas.width;outlineLayer.height=ctx.canvas.height;
  const oc=outlineLayer.getContext('2d');oc.setTransform(ctx.getTransform());oc.fillStyle=border;oc.strokeStyle=border;
  for(const z of shapes){oc.globalAlpha=z.alpha;if(z.type==='rect')oc.fillRect(z.x-1,z.y-1,z.w+(s.outline===1?2:1),z.h+(s.outline===1?2:1));else{oc.lineWidth=z.thickness+2;oc.beginPath();oc.arc(s.outline===2?-1:0,s.outline===2?-1:0,z.radius,0,Math.PI*2);oc.stroke();}}
  // Remove bar interiors before compositing RGBA, including overlapping arms.
  // Transparent crosshair pixels must reveal the scene, not an opaque outline.
  oc.globalCompositeOperation='destination-out';oc.globalAlpha=1;oc.fillStyle='#000';oc.strokeStyle='#000';
  const interior=new Path2D();for(const z of shapes){if(z.type==='rect')interior.rect(z.x,z.y,z.w,z.h);else{oc.lineWidth=z.thickness;oc.beginPath();oc.arc(0,0,z.radius,0,Math.PI*2);oc.stroke();}}oc.fill(interior);
  ctx.save();ctx.resetTransform();ctx.drawImage(outlineLayer,0,0);ctx.restore();
 }
 ctx.globalAlpha=1;ctx.fillStyle=color;
 const rectPath=new Path2D();for(const z of shapes.filter(z=>z.type==='rect'&&z.alpha===1))rectPath.rect(z.x,z.y,z.w,z.h);ctx.fill(rectPath);
 for(const z of shapes){ctx.globalAlpha=z.alpha;if(z.type==='circle'){ctx.strokeStyle=color;ctx.lineWidth=z.thickness;ctx.beginPath();ctx.arc(0,0,z.radius,0,Math.PI*2);ctx.stroke();}else if(z.alpha!==1){ctx.fillStyle=color;ctx.fillRect(z.x,z.y,z.w,z.h);}}
 ctx.restore();
}
const api={styles,defaults,specs,commands,validate,encode,decode,consoleLine,importText,geometry,pixelTiles,draw};root.Crosshair=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
