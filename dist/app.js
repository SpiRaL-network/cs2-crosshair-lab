'use strict';
const C=Crosshair,$=id=>document.getElementById(id);
let state={...C.defaults},history=[],game=[1280,960],screen=[1920,1080],animating=false,shotAt=-1000;
const images={},maps=['ancient','anubis','cache','dust2','inferno','mirage','nuke'],raster=document.createElement('canvas');
for(const map of maps){const im=new Image();im.src=`assets/${map}.png`;images[map]=im;im.onload=()=>render();}
const resolutions=[[640,480],[800,600],[1024,768],[1152,864],[1280,960],[1280,1024],[1440,1080],[1600,1200],[1920,1440],[1280,720],[1600,900],[1920,1080],[2560,1440],[3840,2160],[1280,800],[1440,900],[1680,1050],[1920,1200],[2560,1600],[3440,1440],[5120,1440],[5120,2880],[7680,4320]];
function labelRes([w,h]){const gcd=(a,b)=>b?gcd(b,a%b):a,g=gcd(w,h);return `${w} × ${h} · ${w/g}:${h/g}`;}
for(const id of ['resolution','screen-resolution']){$(id).innerHTML=resolutions.map(r=>`<option value="${r.join('x')}">${labelRes(r)}</option>`).join('')+'<option value="custom">Custom…</option>';}
$('resolution').value='1280x960';$('screen-resolution').value='1920x1080';
const monitorInputs=document.createElement('div');monitorInputs.id='custom-monitor';monitorInputs.hidden=true;monitorInputs.innerHTML='<input id="monitor-w" type="number" min="320" max="16384" value="1920" aria-label="Monitor width"><span>×</span><input id="monitor-h" type="number" min="240" max="16384" value="1080" aria-label="Monitor height">';$('screen-label').after(monitorInputs);
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),4000);}
function remember(){history.push({...state});if(history.length>60)history.shift();$('undo').disabled=false;}
function apply(next){const checked=C.validate(next);remember();state=checked;sync();}
function update(key,value){try{remember();state=C.validate({[key]:Number(value)},state);sync();}catch(e){history.pop();toast(e.message);sync();}}
function row(label,key,min,max,step=1){return `<div class="row" data-key="${key}"><label for="range-${key}">${label}</label><div class="value"><input id="range-${key}" data-param="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${state[key]}" aria-label="${label}"><input id="number-${key}" data-param="${key}" type="number" min="${C.specs[key][0]}" max="${C.specs[key][1]}" step="${step}" value="${state[key]}" aria-label="${label} — value"></div></div>`;}
function selectRow(label,key,options){return `<div class="row" data-key="${key}"><label for="select-${key}">${label}</label><div class="value"><select id="select-${key}" data-param="${key}">${options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div></div>`;}
function colorRow(label,prefix,alpha){return `<div class="row" data-key="${prefix||'color'}"><label for="color-${prefix}">${label}</label><div class="value color-value"><input id="color-${prefix}" type="color" data-color="${prefix}" aria-label="${label}"><span class="alpha-label">OPACITY</span><input type="range" data-param="${alpha}" min="0" max="255" aria-label="Opacity ${label}"><input type="number" data-param="${alpha}" min="0" max="255" aria-label="Opacity ${label} — value"></div></div>`;}
$('style-controls').innerHTML=selectRow('Style <small>New</small>','style',C.styles.map((x,i)=>[i,x]))+colorRow('Color and transparency','', 'a')+selectRow('Outline','outline',[[0,'No outline'],[1,'Full outline'],[2,'Half outline']])+colorRow('Outline color and transparency','o','oa')+row('Thickness <small>Updated</small>','thickness',0,32)+selectRow('Center dot','dot',[[0,'No'],[1,'Yes']])+row('Length <small>Updated</small>','length',0,255)+row('Gap <small>Updated</small>','gap',0,128)+selectRow('T style','t',[[0,'No'],[1,'Yes']])+selectRow('Follow recoil','recoil',[[0,'No'],[1,'Yes']])+row('Dynamic spread limit','spread',0,255)+row('Split distance','split',0,127)+row('Inner bar opacity','inner',0,1,.01)+row('Outer bar opacity','outer',.3,1,.01)+row('Bar / quadrant split ratio','ratio',0,1,.01);
$('scope-controls').innerHTML=selectRow('Use crosshair color for scope dot','scopeColor',[[0,'No'],[1,'Yes']])+row('Scope dot scale','scopeScale',.1,2,.01);
document.querySelectorAll('[data-param]').forEach(el=>el.addEventListener(el.type==='range'?'input':'change',()=>update(el.dataset.param,el.value)));
document.querySelectorAll('[aria-label]').forEach(el=>el.setAttribute('aria-label',el.getAttribute('aria-label').replace(/<[^>]*>/g,'')));
document.querySelectorAll('[data-color]').forEach(el=>el.addEventListener('input',()=>{const p=el.dataset.color;apply({...state,[p+'r']:parseInt(el.value.slice(1,3),16),[p+'g']:parseInt(el.value.slice(3,5),16),[p+'b']:parseInt(el.value.slice(5,7),16)});}));
function sync(){
 document.querySelectorAll('[data-param]').forEach(el=>el.value=state[el.dataset.param]);
 for(const p of ['', 'o'])$('color-'+p).value='#'+[state[p+'r'],state[p+'g'],state[p+'b']].map(v=>v.toString(16).padStart(2,'0')).join('');
 const visibility={dot:state.style!==6,length:[0,2,4,5,7].includes(state.style),gap:![1,6].includes(state.style),t:[0,2,4,5,7].includes(state.style),spread:[0,1,7].includes(state.style),split:state.style===2,inner:state.style===2,outer:state.style===2,ratio:[2,9].includes(state.style),o:state.outline!==0};
 for(const [key,show] of Object.entries(visibility))document.querySelector(`[data-key="${key}"]`).hidden=!show;
 const gapRange=$('range-gap');gapRange.min=state.style===2?-128:0;
 $('console-output').value=C.consoleLine(state);$('share-output').value=C.encode(state);render();
}
function changeResolution(){
 if($('resolution').value==='custom'){$('custom-resolution').hidden=false;const w=Number($('custom-w').value),h=Number($('custom-h').value);if(w>=320&&w<=16384&&h>=240&&h<=16384&&Number.isInteger(w)&&Number.isInteger(h))game=[w,h];else{toast('Resolution: width 320–16384, height 240–16384.');return;}}
 else{$('custom-resolution').hidden=true;game=$('resolution').value.split('x').map(Number);}render();
}
$('resolution').addEventListener('change',changeResolution);for(const x of ['custom-w','custom-h']){ $(x).addEventListener('change',changeResolution);$(x).addEventListener('input',()=>{const w=Number($('custom-w').value),h=Number($('custom-h').value);if(Number.isInteger(w)&&Number.isInteger(h)&&w>=320&&w<=16384&&h>=240&&h<=16384)changeResolution();});}
function changeMonitor(){if($('screen-resolution').value==='custom'){const w=Number($('monitor-w').value),h=Number($('monitor-h').value);if(!Number.isInteger(w)||!Number.isInteger(h)||w<320||w>16384||h<240||h>16384){toast('Monitor: width 320–16384, height 240–16384.');return;}screen=[w,h];}else screen=$('screen-resolution').value.split('x').map(Number);render();}
$('screen-resolution').addEventListener('change',changeMonitor);for(const id of ['monitor-w','monitor-h']){ $(id).addEventListener('change',changeMonitor);$(id).addEventListener('input',()=>{const w=Number($('monitor-w').value),h=Number($('monitor-h').value);if(Number.isInteger(w)&&Number.isInteger(h)&&w>=320&&w<=16384&&h>=240&&h<=16384)changeMonitor();});} $('display-mode').addEventListener('change',render);$('background').addEventListener('change',render);$('center-guide').addEventListener('change',render);
function background(ctx,x,y,w,h){const name=$('background').value,im=images[name];ctx.fillStyle=name==='light'?'#d1d0c6':'#262e33';ctx.fillRect(x,y,w,h);if(im?.complete&&im.naturalWidth){
 // Treat game imagery as a 16:9 scene. Crop its horizontal FOV for 4:3,
 // then apply display scaling to the complete game frame.
 const aspect=game[0]/game[1],crop=Math.min(im.width,im.height*aspect);ctx.drawImage(im,(im.width-crop)/2,0,crop,im.height,x,y,w,h);
}}
function render(time=performance.now()){
 if(typeof time!=='number')time=performance.now();
 const mode=$('display-mode').value,ratio=mode==='native'?game[0]/game[1]:screen[0]/screen[1];$('viewport').style.aspectRatio=ratio;$('screen-label').hidden=mode==='native';monitorInputs.hidden=mode==='native'||$('screen-resolution').value!=='custom';
 const canvas=$('preview'),width=Math.round($('viewport').clientWidth*(window.devicePixelRatio||1)),height=Math.round($('viewport').clientHeight*(window.devicePixelRatio||1));if(!width||!height)return;canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#080909';ctx.fillRect(0,0,width,height);let w=width,h=height,x=0,y=0;
 if(mode==='bars'||mode==='native'){const scale=Math.min(width/game[0],height/game[1]);w=game[0]*scale;h=game[1]*scale;x=(width-w)/2;y=(height-h)/2;}
 background(ctx,x,y,w,h);
 let motion=0;const sinceShot=(time-shotAt)/1000;
 if(animating){const phase=(time%2400)/2400,mm=$('motion-mode').value;motion=mm==='move'?.22+.18*Math.sin(time/500):mm==='fire'?Math.max(0,1-(time%650)/450):Math.max(.25*Math.sin(phase*Math.PI*2)+.25,Math.max(0,1-(time%900)/420));}
 if(sinceShot<.55)motion=Math.max(motion,1-sinceShot/.55);
 const recoil=state.recoil?motion*10*game[1]/state.reference:0;
 const zoom=$('zoom'),zc=zoom.getContext('2d');zc.fillStyle=$('background').value==='light'?'#d1d0c6':'#253038';zc.fillRect(0,0,160,120);zc.imageSmoothingEnabled=false;
 const stretch=mode==='stretch'?ratio/(game[0]/game[1]):1,zsx=8*stretch,zsy=8;
 const im=images[$('background').value];if(im?.complete&&im.naturalWidth){const crop=Math.min(im.width,im.height*game[0]/game[1]),zw=160/zsx/game[0]*crop,zh=120/zsy/game[1]*im.height;zc.drawImage(im,im.width/2-zw/2,im.height/2-zh/2,zw,zh,0,0,160,120);}
 // Tile at the selected game resolution, then use identical pixels in both views.
 // Bounded tile storage also handles custom 16K dimensions without a giant canvas.
 const pixels=C.pixelTiles(state,game[0],game[1],motion,recoil);ctx.imageSmoothingEnabled=false;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 for(const tile of pixels.tiles){
  raster.width=tile.w;raster.height=tile.h;const rc=raster.getContext('2d');C.draw(rc,state,{height:game[1],cx:pixels.anchor[0]-tile.x,cy:pixels.anchor[1]-tile.y,motion});
  ctx.drawImage(raster,x+tile.x*w/game[0],y+tile.y*h/game[1],tile.w*w/game[0],tile.h*h/game[1]);
  const zx=80+(tile.x-game[0]/2)*zsx,zy=60+(tile.y-game[1]/2)*zsy;
  if(zx<160&&zy<120&&zx+tile.w*zsx>0&&zy+tile.h*zsy>0)zc.drawImage(raster,zx,zy,tile.w*zsx,tile.h*zsy);
 }
 ctx.restore();
 if($('center-guide').checked){
  const guide=(context,centerX,centerY,width,height)=>{context.save();context.strokeStyle='#eaa94c';context.lineWidth=1;context.setLineDash([4,4]);context.beginPath();context.moveTo(0,centerY);context.lineTo(width,centerY);context.moveTo(centerX,0);context.lineTo(centerX,height);context.stroke();context.restore();};
  zc.save();zc.strokeStyle='#ffffff28';zc.lineWidth=.5;zc.beginPath();for(let gx=80-(game[0]%2)/2*zsx;gx<=160;gx+=zsx){zc.moveTo(gx,0);zc.lineTo(gx,120);}for(let gx=80-(game[0]%2)/2*zsx-zsx;gx>=0;gx-=zsx){zc.moveTo(gx,0);zc.lineTo(gx,120);}for(let gy=60-(game[1]%2)/2*zsy;gy<=120;gy+=zsy){zc.moveTo(0,gy);zc.lineTo(160,gy);}for(let gy=60-(game[1]%2)/2*zsy-zsy;gy>=0;gy-=zsy){zc.moveTo(0,gy);zc.lineTo(160,gy);}zc.stroke();zc.restore();
  guide(ctx,x+w/2,y+h/2,width,height);guide(zc,80,60,160,120);
 }
 if($('scope-preview')){const sc=$('scope-preview').getContext('2d');sc.fillStyle='#202a2e';sc.fillRect(0,0,160,44);sc.strokeStyle='#8ba0aa33';sc.lineWidth=1;sc.beginPath();sc.moveTo(60,22);sc.lineTo(100,22);sc.moveTo(80,6);sc.lineTo(80,38);sc.stroke();sc.fillStyle=state.scopeColor?`rgba(${state.r},${state.g},${state.b},${state.a/255})`:'#ff3838';sc.beginPath();sc.arc(80,22,state.scopeScale*3*game[1]/960,0,Math.PI*2);sc.fill();}
 $('preview-label').textContent=`${game[0]} × ${game[1]} · ${mode==='stretch'?'STRETCHED':mode==='bars'?'BLACK BARS':'NATIVE'}${animating?' · SIMULATION':''}`;
 $('render-info').textContent=`Aim center (${game[0]/2}, ${game[1]/2}) · ref. ${state.reference}p · ${Math.max(1,Math.round(state.thickness*game[1]/state.reference))} px thick`;
}
$('animate').addEventListener('click',()=>{animating=!animating;$('animate').textContent=animating?'Ⅱ Stop dynamic preview':'▶ Play dynamic preview';$('simulation').hidden=!animating;render();});$('fire').addEventListener('click',()=>{shotAt=performance.now();render();});
function frame(t){if(animating||t-shotAt<600)render(t);requestAnimationFrame(frame);}requestAnimationFrame(frame);
new ResizeObserver(()=>render()).observe($('viewport'));
$('undo').addEventListener('click',()=>{if(history.length)state=history.pop();$('undo').disabled=!history.length;sync();});$('reset').addEventListener('click',()=>apply({...C.defaults}));
for(const [id,dir] of [['previous-map',-1],['next-map',1]])$(id).addEventListener('click',()=>{const i=maps.indexOf($('background').value);$('background').value=maps[(Math.max(0,i)+dir+maps.length)%maps.length];render();});
$('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else $('viewport').requestFullscreen().catch(()=>toast('Full screen is unavailable in this browser.'));});
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copied to clipboard.');}catch(e){toast('Clipboard unavailable: select and copy the text manually.');}}
$('copy-console').addEventListener('click',()=>copy(C.consoleLine(state)));$('copy-code').addEventListener('click',()=>copy(C.encode(state)));
$('download-cfg').addEventListener('click',()=>{const blob=new Blob(['// CS2 Crosshair Lab — 1.41.8.8\n'+C.consoleLine(state,true)+'\n'],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='crosshair.cfg';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
for(const id of ['import-open','export-open'])$(id).addEventListener('click',()=>{$('import-error').textContent='';$('import-dialog').showModal();});
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
function doImport(text){try{const r=C.importText(text,game[1]);apply(r.state);$('import-dialog').close();toast(r.warnings.join(' ')||'Crosshair imported.');}catch(e){$('import-error').textContent=e.message;}}
$('import-apply').addEventListener('click',()=>doImport($('import-input').value));$('cfg-file').addEventListener('change',async e=>{if(e.target.files[0])$('import-input').value=await e.target.files[0].text();});
$('sample-standard').addEventListener('click',()=>doImport('CSnrWaoboZNbyxeozF9GTnG3kfQxpP2CpzCKOiMztS724T'));$('sample-outline').addEventListener('click',()=>doImport('CS3FWPJxv2MzhdGLjqmiopSnQxH9aLGNtTf5nkNLEYCfAd'));
sync();

// Lazy catalogue: enumerate only the visible page, even for millions of combinations.
let catalogueMode='families',page=0,plan=[],total=0;
const PAGE_SIZE=40;
const familyNotes=['Spread and movement','Spread and movement','Splitting bars','Fixed ring','Fixed cross','Gap during firing','Single dot','Four moving corners','Closed square','Four fixed corners'];
const rangePair=(key,name,min,max)=>`<label>${name}<span class="range-pair"><input id="catalogue-${key}-min" type="number" min="${C.specs[key][0]}" max="${C.specs[key][1]}" value="${min}" aria-label="${name} minimum"><span>to</span><input id="catalogue-${key}-max" type="number" min="${C.specs[key][0]}" max="${C.specs[key][1]}" value="${max}" aria-label="${name} maximum"></span></label>`;
$('catalogue-controls').innerHTML=`<label>Family<select id="catalogue-family"><option value="all">All families</option>${C.styles.map((s,i)=>`<option value="${i}">${s}</option>`).join('')}</select></label>`+rangePair('length','Length',0,8)+rangePair('thickness','Thickness',1,4)+rangePair('gap','Gap',0,6)+`<label>Center dot<select id="catalogue-dot"><option value="current">Current setting</option><option value="both">With and without</option><option value="0">No dot</option><option value="1">With dot</option></select></label><label>T style<select id="catalogue-t"><option value="current">Current setting</option><option value="both">With and without</option><option value="0">No</option><option value="1">Yes</option></select></label><button id="catalogue-generate" class="primary">Show variations</button>`;
function valuesRange(key){const min=Number($(`catalogue-${key}-min`).value),max=Number($(`catalogue-${key}-max`).value),[lo,hi]=C.specs[key];if(!Number.isInteger(min)||!Number.isInteger(max)||min<lo||max>hi||min>max)throw new Error(`Invalid range: ${key}.`);return {min,count:max-min+1};}
function optionsFor(key){const v=$('catalogue-'+key).value;return v==='both'?[0,1]:v==='current'?[state[key]]:[Number(v)];}
function makePlan(){
 const range={length:valuesRange('length'),thickness:valuesRange('thickness'),gap:valuesRange('gap')},family=$('catalogue-family').value;
 const list=family==='all'?C.styles.map((s,i)=>i):[Number(family)];let offset=0;
 plan=list.map(style=>{
  const axes=[['length',[0,2,4,5,7].includes(style)?range.length:{min:state.length,count:1}],['thickness',range.thickness],['gap',style===6?{min:state.gap,count:1}:range.gap],['dot',{values:style===6?[0]:optionsFor('dot')}],['t',{values:[0,2,4,5,7].includes(style)?optionsFor('t'):[0]}]];
  for(const [,a] of axes)if(a.values)a.count=a.values.length;
  const count=axes.reduce((n,[,a])=>n*a.count,1),p={style,axes,count,offset};offset+=count;return p;
 });total=offset;
}
function variantAt(index){const p=plan.find(p=>index>=p.offset&&index<p.offset+p.count),s={...state,style:p.style};let n=index-p.offset;for(const [key,a] of p.axes){const digit=n%a.count;n=Math.floor(n/a.count);s[key]=a.values?a.values[digit]:a.min+digit;}return s;}
function catalogueCard(s,title,note){
 const button=document.createElement('button');button.className='catalogue-card';const canvas=document.createElement('canvas');canvas.width=180;canvas.height=100;button.append(canvas);
 const txt=document.createElement('span');txt.className='card-title';txt.textContent=title;const small=document.createElement('small');small.textContent=note;txt.append(small);button.append(txt);
 const ctx=canvas.getContext('2d');ctx.fillStyle='#1c2b33';ctx.fillRect(0,0,180,100);const aspect=$('display-mode').value==='stretch'?(screen[0]/screen[1])/(game[0]/game[1]):1;C.draw(ctx,s,{height:game[1],cx:90,cy:50,sx:3*aspect,sy:3,motion:0});
 button.addEventListener('click',()=>{apply(s);$('catalogue-dialog').close();toast('Crosshair loaded into the editor.');});return button;
}
function showCatalogue(){
 $('families-tab').classList.toggle('active',catalogueMode==='families');$('variants-tab').classList.toggle('active',catalogueMode==='variants');$('catalogue-controls').hidden=catalogueMode==='families';$('pagination').hidden=catalogueMode==='families';$('catalogue-grid').replaceChildren();
 if(catalogueMode==='families'){
  $('catalogue-info').textContent='Choose a family. Editor colors and resolution are preserved. Thumbnails enlarged ×3.';
  C.styles.forEach((name,style)=>{const s={...state,style,length:style===state.style?state.length:8,gap:style===state.style?state.gap:5};$('catalogue-grid').append(catalogueCard(s,name,familyNotes[style]));});
 }else{
  try{makePlan();page=Math.min(page,Math.max(0,Math.ceil(total/PAGE_SIZE)-1));$('catalogue-info').textContent=`${total.toLocaleString('en-US')} combinations within your ranges · current color, outline and dynamic settings · thumbnails ×3.`;
   for(let i=page*PAGE_SIZE;i<Math.min(total,(page+1)*PAGE_SIZE);i++){const s=variantAt(i);$('catalogue-grid').append(catalogueCard(s,C.styles[s.style],`L ${s.length} · E ${s.thickness} · gap ${s.gap}${s.dot?' · dot':''}${s.t?' · T':''}`));}
   $('page-info').textContent=`Page ${(page+1).toLocaleString('en-US')} / ${Math.ceil(total/PAGE_SIZE).toLocaleString('en-US')}`;$('page-prev').disabled=page===0;$('page-next').disabled=(page+1)*PAGE_SIZE>=total;
  }catch(e){$('catalogue-info').textContent=e.message;$('page-prev').disabled=true;$('page-next').disabled=true;}
 }
}
$('catalogue-open').addEventListener('click',()=>{showCatalogue();$('catalogue-dialog').showModal();});$('families-tab').addEventListener('click',()=>{catalogueMode='families';showCatalogue();});$('variants-tab').addEventListener('click',()=>{catalogueMode='variants';page=0;showCatalogue();});$('catalogue-generate').addEventListener('click',()=>{page=0;showCatalogue();});
$('page-prev').addEventListener('click',()=>{page--;showCatalogue();});$('page-next').addEventListener('click',()=>{page++;showCatalogue();});
$('editor-tab').addEventListener('click',()=>document.querySelectorAll('dialog[open]').forEach(x=>x.close()));
const scopeRow=document.createElement('div');scopeRow.className='row';scopeRow.innerHTML='<span>Scope dot · enlarged preview</span><canvas id="scope-preview" width="160" height="44" aria-label="Scope dot preview"></canvas>';$('scope-controls').append(scopeRow);

// Structured tools use the same validated actions as the visible editor.
if(document.modelContext?.registerTool){
 const lifetime=new AbortController();
 const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifetime.signal})).catch(()=>{});}catch{}};
 register({name:'read_crosshair',description:'Read the current CS2 crosshair settings, code and console line.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({settings:{...state},resolution:[...game],code:C.encode(state),console:C.consoleLine(state)})});
 register({name:'configure_crosshair',description:'Update CS2 crosshair parameters in the visible editor. Does not change the game.',inputSchema:{type:'object',properties:Object.fromEntries(Object.entries(C.specs).map(([k,[minimum,maximum,step]])=>[k,{type:step===1?'integer':'number',minimum,maximum}])),additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Object expected');const next=C.validate(input,state);apply(next);return {settings:{...state},code:C.encode(state),console:C.consoleLine(state)};}});
 addEventListener('pagehide',()=>lifetime.abort(),{once:true});
}
render();
