(function(){
  const META = window.CATEGORY_META;
  const TAXO = window.TAXONOMY;

  const VB_W = 1600, VB_H = 1000;
  const CENTER = { x: VB_W/2, y: VB_H/2 };
  const EDGE_PAD = 0.085;
  const TRUNK_LEN = 220, LEAF_MIN = 360, LEAF_MAX = 720;
  const DUR_TRUNK = 680, DUR_LEAF = 620;
  const CURVINESS = 0.48, WOBBLE = 0.06;

  let search, notesBox, svg;
  let gGraph, gLabels, gCallouts, gBlobs, gStamps;
  let centerLabel;
  let renderToken = 0;
  const trunks = {};
  const labels = [];

  let catSel, groupSel, subSel, nameSel;
  let reverseIdx = { nameToSub:{}, subToGroup:{}, groupToCat:{} };

  function $(s, root=document){ return root.querySelector(s); }
  const nextFrame = ()=> new Promise(r=> requestAnimationFrame(()=> r()));

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    svg = $("#canvas");
    search = $("#search");
    notesBox = $("#notes");
    catSel = $("#catSelect"); groupSel = $("#groupSelect"); subSel = $("#subgroupSelect"); nameSel = $("#nameSelect");

    buildReverseIndex();

    centerLabel = document.createElement("div");
    centerLabel.className = "center-label";
    $(".canvas-wrap").appendChild(centerLabel);

    gGraph    = $("#graph-layer");
    gLabels   = $("#labels-layer");
    gCallouts = $("#callouts-layer");
    gBlobs    = $("#blobs-layer");
    gStamps   = $("#stamps-layer");

    svg.addEventListener("wheel", e => e.preventDefault(), { passive:false });
    svg.addEventListener("mousedown", e => e.preventDefault());

    fillSelect(catSel, ['Не выбрано', ...TAXO.categories]);
    fillSelect(groupSel, ['Не выбрано']);
    fillSelect(subSel, ['Не выбрано']);
    fillSelect(nameSel, ['Не выбрано']);

    catSel.addEventListener('change', ()=>{
      const cat = catSel.value;
      const groups = TAXO.groups[cat] || [];
      fillSelect(groupSel, ['Не выбрано', ...groups]);
      fillSelect(subSel, ['Не выбрано']);
      fillSelect(nameSel, ['Не выбрано']);
      clearAndMessage('Выбери группу/подгруппу/наименование для построения диаграммы.');
    });
    groupSel.addEventListener('change', ()=>{
      const grp = groupSel.value;
      const subs = TAXO.subgroups[grp] || [];
      fillSelect(subSel, ['Не выбрано', ...subs]);
      fillSelect(nameSel, ['Не выбрано']);
      if(grp !== 'Не выбрано') { render({ centerKey: grp }); }
      else clearAndMessage('Выбери подгруппу или наименование…');
    });
    subSel.addEventListener('change', ()=>{
      const sub = subSel.value;
      const names = TAXO.names[sub] || [];
      fillSelect(nameSel, ['Не выбрано', ...names]);
      if(sub !== 'Не выбрано') { render({ centerKey: sub }); }
      else clearAndMessage('Выбери наименование…');
    });
    nameSel.addEventListener('change', ()=>{
      const nm = nameSel.value;
      if(nm !== 'Не выбрано'){ backFill(nm); render({ centerKey: nm }); }
      else clearAndMessage('—');
    });

    const allKeys = ()=> Object.keys(window.FLAVOR_DATA||{});
    search.addEventListener("input", ()=>{
      const q = search.value.trim().toLowerCase();
      if(!q){ return; }
      const match = allKeys().find(k => k.toLowerCase().includes(q));
      if(match){ backFill(match); render({ centerKey: match }); }
    });

    clearAndMessage('Выбери группу/подгруппу/наименование для построения диаграммы.');
  }

  function backFill(nameOrKey){
    const key = nameOrKey;
    const sub = reverseIdx.nameToSub[key];
    const grp = reverseIdx.subToGroup[sub] || reverseIdx.subToGroup[key];
    const cat = reverseIdx.groupToCat[grp] || reverseIdx.groupToCat[key];
    if(cat){ catSel.value = cat; }
    if(grp){
      fillSelect(groupSel, ['Не выбрано', ...(TAXO.groups[cat]||[])]);
      groupSel.value = grp;
    }
    if(sub){
      fillSelect(subSel, ['Не выбрано', ...(TAXO.subgroups[grp]||[])]);
      subSel.value = sub;
      const names = TAXO.names[sub] || [];
      fillSelect(nameSel, ['Не выбрано', ...names]);
      if((TAXO.names[sub]||[]).includes(nameOrKey)) nameSel.value = nameOrKey;
    }else{
      fillSelect(subSel, ['Не выбрано']);
      fillSelect(nameSel, ['Не выбрано']);
    }
  }

  function buildReverseIndex(){
    const idx = reverseIdx;
    Object.entries(TAXO.names).forEach(([sub, arr])=> arr.forEach(n=> idx.nameToSub[n]=sub));
    Object.entries(TAXO.subgroups).forEach(([grp, arr])=> arr.forEach(s=> idx.subToGroup[s]=grp));
    Object.entries(TAXO.groups).forEach(([cat, arr])=> arr.forEach(g=> idx.groupToCat[g]=cat));
  }

  function fillSelect(el, arr){
    const prev = el.value;
    el.innerHTML = arr.map(v=>`<option value="${v}">${v}</option>`).join('');
    el.value = arr.includes(prev)? prev : arr[0] || 'Не выбрано';
  }

  function clearAndMessage(msg){
    ++renderToken;
    gGraph.innerHTML = ''; gLabels.innerHTML=''; gCallouts.innerHTML=''; gBlobs.innerHTML=''; gStamps.innerHTML='';
    centerLabel.textContent = msg;
    const wrap = $('.canvas-wrap').getBoundingClientRect();
    centerLabel.style.left = (wrap.width/2) + 'px'; centerLabel.style.top = (wrap.height/2) + 'px';
    notesBox.textContent = '—';
  }

  function nonEmpty(ds){
    if(!ds) return false;
    return (ds.best&&ds.best.length) || (ds.good&&ds.good.length) || (ds.bad&&ds.bad.length) || (ds.unexpected&&ds.unexpected.length);
  }
  function cloneEmpty(){ return { notes:'', best:[], good:[], bad:[], unexpected:[] }; }
  function mergeInto(agg, part){
    ['best','good','bad','unexpected'].forEach(k=>{
      (part[k]||[]).forEach(x=>{
        if(!agg[k].some(y=> y.to===x.to)) agg[k].push({to:x.to, tip:x.tip||''});
      });
    });
    if(part.notes){ agg.notes += (agg.notes? '\n' : '') + part.notes; }
  }
  function aggregateFromChildren(key){
    const agg = cloneEmpty();
    if(TAXO.names[key]){
      (TAXO.names[key]||[]).forEach(nm=>{ if(window.FLAVOR_DATA[nm]) mergeInto(agg, window.FLAVOR_DATA[nm]); });
      return nonEmpty(agg)? agg : null;
    }
    if(TAXO.subgroups[key]){
      (TAXO.subgroups[key]||[]).forEach(sub=>{
        const subDs = window.FLAVOR_DATA[sub];
        if(nonEmpty(subDs)) mergeInto(agg, subDs);
        (TAXO.names[sub]||[]).forEach(nm=>{ if(window.FLAVOR_DATA[nm]) mergeInto(agg, window.FLAVOR_DATA[nm]); });
      });
      return nonEmpty(agg)? agg : null;
    }
    return null;
  }
  function datasetFor(key){
    const ds = window.FLAVOR_DATA[key];
    if(nonEmpty(ds)) return ds;
    const agg = aggregateFromChildren(key);
    return agg || ds || cloneEmpty();
  }

  async function render(state){
    const myToken = ++renderToken;
    gGraph.innerHTML = ''; gLabels.innerHTML = ''; gCallouts.innerHTML = ''; gBlobs.innerHTML = ''; gStamps.innerHTML = '';
    for(const k in trunks) delete trunks[k];
    labels.length = 0;

    const wrap = document.querySelector('.canvas-wrap').getBoundingClientRect();
    centerLabel.style.left = (wrap.width/2) + 'px';
    centerLabel.style.top  = (wrap.height/2) + 'px';
    centerLabel.textContent = state.centerKey;

    const dataset = datasetFor(state.centerKey);
    if(!dataset){ centerLabel.textContent = '—'; return; }

    const groups = META.map(meta => ({
      meta,
      items: (dataset[meta.key] || []).map(p => ({ ...p, category: meta.key, targetKey: p.to }))
    }));

    notesBox.textContent = dataset?.notes || '—';

    drawBlobs();

    await Promise.all(
      groups.map(g=>{
        const hub = clampPoint(pointOnAngle(CENTER, g.meta.angle, TRUNK_LEN));
        g.hub = hub;
        return animatePath(CENTER, hub, g.meta.key, DUR_TRUNK, g.meta.angle, true).then(path=>{
          trunks[g.meta.key] = path; stampAt(hub, g.meta.key);
        });
      })
    );
    if(myToken !== renderToken) return;

    const leafPromises = [];
    for(const group of groups){
      const { meta, items, hub } = group;
      const count = items.length;
      if(count === 0) continue;
      const spread = Math.min(2.0, 0.9 + Math.log2(count+1)*0.5);
      for(let idx=0; idx<count; idx++){
        const item = items[idx];
        const t = count>1 ? (idx/(count-1)) : 0.5;
        const angle = meta.angle - spread/2 + t*spread + (Math.sin(idx*97.3)*0.05);
        const baseR = LEAF_MIN + (LEAF_MAX-LEAF_MIN) * (0.2 + 0.7*t);
        const jitterR = baseR * (1 + (Math.cos(idx*13.7)*0.05));
        const leafPoint = clampPoint(pointOnAngle(CENTER, angle, jitterR));
        const delay = Math.floor((Math.sin(idx*17.7)+1)*40);
        leafPromises.push(
          new Promise(res=> setTimeout(res, delay)).then(()=> 
            animatePath(hub, leafPoint, meta.key, DUR_LEAF, angle, false).then(async (leaf)=>{
              endpointHalo(leafPoint, meta.key);
              const dot  = endpoint(leafPoint, meta.key);
              const node = label(item.to, leafPoint);
              await nextFrame();
              try{
                const textEl = node.querySelector('text');
                const bb = textEl.getBBox();
                const rec = labels[labels.length-1];
                rec.width = Math.ceil(bb.width) + 16;
                rec.height = Math.ceil(bb.height) + 8;
                const hit = node.querySelector('rect');
                const side = (leafPoint.x < CENTER.x) ? -1 : 1;
                hit.setAttribute('x', side<0 ? -(rec.width+2) : -2);
                hit.setAttribute('width', rec.width + 4);
              }catch(e){}
              attachInteractivity({ leaf, dot, node, catKey: meta.key, targetKey: item.to });
            })
          )
        );
      }
    }
    await Promise.all(leafPromises);
    if(myToken !== renderToken) return;
    resolveLabelOverlaps();
  }

  function pointOnAngle(origin, angle, r){ return { x: origin.x + Math.cos(angle)*r, y: origin.y + Math.sin(angle)*r }; }
  function clampPoint(p){
    const minX = VB_W*EDGE_PAD, maxX = VB_W*(1-EDGE_PAD);
    const minY = VB_H*EDGE_PAD, maxY = VB_H*(1-EDGE_PAD);
    let x = p.x, y = p.y;
    if(x < minX || x > maxX || y < minY || y > maxY){
      const dx = x - CENTER.x, dy = y - CENTER.y;
      let scale = 1.0;
      if(dx !== 0){ const sx = dx > 0 ? (maxX - CENTER.x)/dx : (minX - CENTER.x)/dx; scale = Math.min(scale, sx); }
      if(dy !== 0){ const sy = dy > 0 ? (maxY - CENTER.y)/dy : (minY - CENTER.y)/dy; scale = Math.min(scale, sy); }
      x = CENTER.x + dx*scale; y = CENTER.y + dy*scale;
    }
    return { x, y };
  }

  function seeded(n){ let x = Math.sin(n)*10000; return x - Math.floor(x); }
  function cubicFrom(a, b, startAngle){
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirToEnd = Math.atan2(dy, dx);
    const wob = dist*WOBBLE;
    const id = Math.abs(Math.floor(a.x*7 + a.y*13 + b.x*17 + b.y*19));
    const w1 = (seeded(id) - 0.5) * wob;
    const w2 = (seeded(id+1) - 0.5) * wob;
    const c1 = { x: a.x + Math.cos(startAngle)*dist*CURVINESS + w1,
                 y: a.y + Math.sin(startAngle)*dist*CURVINESS - w1*0.6 };
    const c2 = { x: b.x - Math.cos(dirToEnd)*dist*CURVINESS*0.95 + w2,
                 y: b.y - Math.sin(dirToEnd)*dist*CURVINESS*0.95 + w2*0.6 };
    return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
  }

  function animatePath(a, b, cat, durationMs=660, startAngle=null, isTrunk=false){
    return new Promise((resolve)=>{
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      const ang = startAngle==null ? Math.atan2(b.y-a.y, b.x-a.x) : startAngle;
      path.setAttribute('d', cubicFrom(a,b,ang));
      const classes = ['link', `link-${cat}`, isTrunk?'link-trunk':'link-leaf'];
      path.setAttribute('class', classes.join(' '));
      document.querySelector('#graph-layer').appendChild(path);
      const len = path.getTotalLength();
      path.style.strokeDasharray = f'{len} {len}';
      path.style.strokeDashoffset = f'{len}';
      path.style.transition = 'none';
      path.classList.remove('anim-start');
      requestAnimationFrame(()=>{
        void path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset ${durationMs}ms cubic-bezier(.28,.86,.2,1)`;
        path.classList.add('anim-start');
        path.style.strokeDashoffset = '0';
        setTimeout(()=> resolve(path), durationMs);
      });
    });
  }

  function endpointHalo(p, cat){
    const halo = document.createElementNS('http://www.w3.org/2000/svg','circle');
    halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y); halo.setAttribute('r', 10);
    halo.setAttribute('class', `dot-halo endpoint-${cat}`);
    document.querySelector('#graph-layer').appendChild(halo);
    return halo;
  }
  function endpoint(p, cat){
    const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', 6.5);
    dot.setAttribute('class', `endpoint endpoint-${cat}`);
    document.querySelector('#graph-layer').appendChild(dot);
    requestAnimationFrame(()=> requestAnimationFrame(()=> dot.classList.add('show')));
    return dot;
  }
  function label(textStr, pos){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    const side = (pos.x < CENTER.x) ? 'left' : 'right';
    g.setAttribute('class', `node leaf show ${side}`);
    g.setAttribute('data-key', textStr);
    g.setAttribute('transform', `translate(${pos.x},${pos.y})`);
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.textContent = textStr;
    const xoff = (side==='left') ? -12 : 12;
    text.setAttribute('x', xoff); text.setAttribute('y', 2); text.setAttribute('font-size', 14);
    g.appendChild(text);
    const hit = document.createElementNS('http://www.w3.org/2000/svg','rect');
    hit.setAttribute('x', -2); hit.setAttribute('y', -14);
    hit.setAttribute('width', 360); hit.setAttribute('height', 28);
    hit.setAttribute('fill', 'transparent');
    g.appendChild(hit);
    document.querySelector('#labels-layer').appendChild(g);
    labels.push({ g, pos: {...pos}, width: 360, height: 28, anchor: {...pos} });
    return g;
  }
  function stampAt(p, catKey){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','stamp');
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 11);
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', p.x); t.setAttribute('y', p.y+0.5);
    let icon = '•'; if(catKey==='best') icon='★'; else if(catKey==='unexpected') icon='!'; else if(catKey==='good') icon='➜';
    t.textContent = icon;
    g.appendChild(c); g.appendChild(t);
    document.querySelector('#stamps-layer').appendChild(g);
  }
  function drawBlobs(){
    const blobSpec = [
      {key:'best', x: CENTER.x, y: CENTER.y-240, rx: 240, ry: 140},
      {key:'good', x: CENTER.x+320, y: CENTER.y+40, rx: 260, ry: 150},
      {key:'bad', x: CENTER.x-320, y: CENTER.y+20, rx: 260, ry: 150},
      {key:'unexpected', x: CENTER.x, y: CENTER.y+260, rx: 230, ry: 140},
    ];
    blobSpec.forEach(b=>{
      const e = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
      e.setAttribute('cx', b.x); e.setAttribute('cy', b.y);
      e.setAttribute('rx', b.rx); e.setAttribute('ry', b.ry);
      e.setAttribute('class', `blob blob-${b.key}`);
      document.querySelector('#blobs-layer').appendChild(e);
    });
  }
  function attachInteractivity({ leaf, dot, node, catKey, targetKey }){
    const enter = ()=>{ const allLinks = document.querySelector('#graph-layer').querySelectorAll('.link'); allLinks.forEach(p=> p.classList.add('dim')); leaf.classList.remove('dim'); leaf.classList.add('is-highlight'); const trunk = trunks[catKey]; if(trunk){ trunk.classList.remove('dim'); trunk.classList.add('is-highlight-trunk'); } };
    const leave = ()=>{ const allLinks = document.querySelector('#graph-layer').querySelectorAll('.link'); allLinks.forEach(p=> p.classList.remove('dim')); leaf.classList.remove('is-highlight'); const trunk = trunks[catKey]; if(trunk){ trunk.classList.remove('is-highlight-trunk'); } };
    node.addEventListener('mouseenter', enter);
    node.addEventListener('mouseleave', leave);
    dot.addEventListener('mouseenter', enter);
    dot.addEventListener('mouseleave', leave);
    const activate = ()=>{ if(targetKey){ backFill(targetKey); render({ centerKey: targetKey }); } };
    node.addEventListener('click', activate);
    dot.addEventListener('click', activate);
  }

  function rectOf(l){ return { x: l.pos.x- (l.g.classList.contains('left')? l.width : 2), y: l.pos.y-14, w: l.width, h: l.height }; }
  function overlap1D(a1, a2, b1, b2){ const left = Math.max(a1,b1), right = Math.min(a2,b2); return Math.max(0, right-left); }
  function vecFromCenter(p){ const dx = p.x - (1600/2), dy = p.y - (1000/2); const len = Math.hypot(dx, dy) || 1; return { x: dx/len, y: dy/len }; }

  function resolveLabelOverlaps(){
    if(labels.length < 2) return;
    const passes = 22;
    for(let pass=0; pass<passes; pass++){
      for(let i=0; i<labels.length; i++){
        for(let j=i+1; j<labels.length; j++){
          const a = labels[i], b = labels[j];
          const ar = rectOf(a), br = rectOf(b);
          const dx = overlap1D(ar.x, ar.x+ar.w, br.x, br.x+br.w);
          const dy = overlap1D(ar.y, ar.y+ar.h, br.y, br.y+br.h);
          if(dx>0 && dy>0){
            const va = vecFromCenter(a.pos); const vb = vecFromCenter(b.pos);
            const abx = (a.pos.x - b.pos.x), aby = (a.pos.y - b.pos.y);
            const len = Math.hypot(abx, aby) || 1;
            const tangent = { x: -aby/len, y: abx/len };
            const step = 1.2 * (1 - pass/passes);
            a.pos.x += va.x*step + tangent.x*0.4*step; a.pos.y += va.y*step + tangent.y*0.4*step;
            b.pos.x += vb.x*step - tangent.x*0.4*step; b.pos.y += vb.y*step - tangent.y*0.4*step;
          }
        }
      }
      for(const l of labels){ l.pos = clampPoint(l.pos); }
    }
    labels.forEach(l=> l.g.setAttribute('transform', `translate(${l.pos.x},${l.pos.y})`) );
  }
})();