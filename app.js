(function(){
  'use strict';
  const META = (window && window.CATEGORY_META) || [
    {"key":"best","angle":-1.570795,"color":"#2ecc71"},
    {"key":"good","angle":0,"color":"#f1c40f"},
    {"key":"bad","angle":3.14159,"color":"#e74c3c"},
    {"key":"unexpected","angle":1.570795,"color":"#00c2ff"}
  ];
  const TAXO = (window && window.TAXONOMY) || {categories:[], groups:{}, subgroups:{}, names:{}};

  const VB_W = 1600, VB_H = 1000;
  const CENTER = { x: VB_W/2, y: VB_H/2 };
  const EDGE_PAD = 0.085;
  const TRUNK_LEN = 220, LEAF_MIN = 360, LEAF_MAX = 760;
  const DUR_TRUNK = 680, DUR_LEAF = 620;
  const CURVINESS = 0.55, WOBBLE = 0.10;

  let search, notesBox, svg, zoomInBtn, zoomOutBtn, zoomResetBtn;
  let gGraph, gLabels, gCallouts, gBlobs, gStamps;
  let centerLabel, tooltip;
  let renderToken = 0;
  const trunks = {};
  const labels = [];

  let catSel, groupSel, subSel, nameSel;
  let reverseIdx = { nameToSub:{}, subToGroup:{}, groupToCat:{} };

  // --- zoom/pan state (applies to all layers together)
  const zoom = { scale: 1, min: 0.8, max: 3.0, x: 0, y: 0 };
  let isPanning = false;
  let lastPan = {x:0,y:0};
  let pinch = null; // {startD, startS, cx, cy, activeIds, points}

  const $ = (s, root=document)=> root.querySelector(s);

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    svg = $("#canvas");
    if(!svg){
      showError("Не найден <svg id=\"canvas\">");
      return;
    }
    search = $("#search");
    notesBox = $("#notes");
    tooltip = $("#tooltip");
    catSel = $("#catSelect"); groupSel = $("#groupSelect"); subSel = $("#subgroupSelect"); nameSel = $("#nameSelect");
    zoomInBtn = $("#zoomIn"); zoomOutBtn = $("#zoomOut"); zoomResetBtn = $("#zoomReset");

    if(!window.TAXONOMY || !window.CATEGORY_META){
      showError("data.js не загрузился: проверь синтаксис (лишние символы, экранирование, запятая).");
      return;
    }

    buildReverseIndex();

    centerLabel = document.createElement("div");
    centerLabel.className = "center-label";
    $(".canvas-wrap").appendChild(centerLabel);

    gGraph    = $("#graph-layer");
    gLabels   = $("#labels-layer");
    gCallouts = $("#callouts-layer");
    gBlobs    = $("#blobs-layer");
    gStamps   = $("#stamps-layer");

    // Колесо: ctrl/cmd + колесо — масштаб; без модификаторов — обычный скролл страницы
    svg.addEventListener("wheel", onWheel, { passive:false });

    // taxonomy
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
      // Для категорий колесо НЕ строим
      clearAndMessage('Выбери группу/подгруппу/наименование для построения диаграммы.');
      scrollCanvasIntoView();
    });
    groupSel.addEventListener('change', ()=>{
      const grp = groupSel.value;
      const subs = TAXO.subgroups[grp] || [];
      fillSelect(subSel, ['Не выбрано', ...subs]);
      fillSelect(nameSel, ['Не выбрано']);
      if(grp !== 'Не выбрано') { render({ centerKey: grp }); }
      else clearAndMessage('Выбери подгруппу или наименование…');
      scrollCanvasIntoView();
    });
    subSel.addEventListener('change', ()=>{
      const sub = subSel.value;
      const names = TAXO.names[sub] || [];
      fillSelect(nameSel, ['Не выбрано', ...names]);
      if(sub !== 'Не выбрано') { render({ centerKey: sub }); }
      else clearAndMessage('Выбери наименование…');
      scrollCanvasIntoView();
    });
    nameSel.addEventListener('change', ()=>{
      const nm = nameSel.value;
      if(nm !== 'Не выбрано'){ backFill(nm); render({ centerKey: nm }); }
      else clearAndMessage('—');
      scrollCanvasIntoView();
    });

    // omni-search
    search?.addEventListener("input", ()=>{
      const q = (search.value || "").trim().toLowerCase();
      if(!q){ return; }
      const keys = allSearchKeys();
      const match = keys.find(k => String(k).toLowerCase().includes(q));
      if (match) {
        backFill(match);
        if(!isCategory(match)) render({ centerKey: match });
        else clearAndMessage('Выбери группу/подгруппу/наименование…');
        scrollCanvasIntoView();
      }
    });

    // touch & pointer handlers for pinch-zoom and pan
    setupTouchHandlers();

    // zoom buttons
    zoomInBtn?.addEventListener('click', ()=> zoomTo(zoom.scale*1.14));
    zoomOutBtn?.addEventListener('click', ()=> zoomTo(zoom.scale/1.14));
    zoomResetBtn?.addEventListener('click', ()=> { zoom.scale=1; zoom.x=0; zoom.y=0; applyZoomTransform(); });

    // Начальное увеличение на узких экранах
    if (window.matchMedia && window.matchMedia("(max-width: 960px)").matches){
      zoom.scale = 1.22;
    }

    clearAndMessage('Выбери группу/подгруппу/наименование для построения диаграммы.');
    applyZoomTransform();
  }

  function updateTouchAction(){
    if (!svg) return;
    svg.style.touchAction = (zoom.scale <= 1 ? 'auto' : 'none');
  }

  function zoomTo(next){
    const prev = zoom.scale;
    const clamped = Math.max(zoom.min, Math.min(zoom.max, next));
    const k = clamped / prev;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width/2, cy = rect.height/2;
    zoom.x = cx - k * (cx - zoom.x);
    zoom.y = cy - k * (cy - zoom.y);
    zoom.scale = clamped;
    applyZoomTransform();
  }

  function onWheel(e){
    if(!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const prev = zoom.scale;
    const factor = Math.exp((-e.deltaY) * 0.0012);
    zoom.scale = Math.max(zoom.min, Math.min(zoom.max, prev * factor));
    const k = zoom.scale / prev;
    zoom.x = cx - k * (cx - zoom.x);
    zoom.y = cy - k * (cy - zoom.y);
    applyZoomTransform();
  }

  function setupTouchHandlers(){
    updateTouchAction();

    svg.addEventListener('pointerdown', (e)=>{
      if((e.pointerType === 'touch' || e.pointerType === 'pen') && zoom.scale <= 1){
        isPanning = false;
        return;
      }
      if(e.isPrimary){
        isPanning = true;
        lastPan = {x: e.clientX, y: e.clientY};
        svg.setPointerCapture?.(e.pointerId);
      }
      updatePinchState('down', e);
    }, {passive:true});

    svg.addEventListener('pointermove', (e)=>{
      if(pinch && pinch.activeIds?.has(e.pointerId) && pinch.activeIds.size===2){
        e.preventDefault();
        updatePinchState('move', e);
        return;
      }
      if(isPanning && zoom.scale > 1){
        e.preventDefault();
        const dx = e.clientX - lastPan.x;
        const dy = e.clientY - lastPan.y;
        lastPan = {x: e.clientX, y: e.clientY};
        zoom.x += dx;
        zoom.y += dy;
        applyZoomTransform();
      }
    }, {passive:false});

    const end = (e)=>{
      isPanning = false;
      updatePinchState('up', e);
      try{ svg.releasePointerCapture?.(e.pointerId); }catch(_){}
    };
    svg.addEventListener('pointerup', end, {passive:true});
    svg.addEventListener('pointercancel', end, {passive:true});
  }

  function updatePinchState(type, e){
    if(!pinch) pinch = {activeIds:new Set(), points:new Map(), startD:0, startS:1, cx:0, cy:0};
    if(type==='down'){
      pinch.activeIds.add(e.pointerId);
      pinch.points.set(e.pointerId, {x:e.clientX, y:e.clientY});
    }
    if(type==='move' && pinch.activeIds.size===2){
      pinch.points.set(e.pointerId, {x:e.clientX, y:e.clientY});
      const pts = Array.from(pinch.points.values());
      if(pts.length<2) return;
      const [p1,p2] = pts;
      const d = Math.hypot(p2.x-p1.x, p2.y-p1.y);
      if(!pinch.inited){
        pinch.inited = true;
        pinch.startD = d || 1;
        pinch.startS = zoom.scale;
        pinch.cx = (p1.x + p2.x)/2;
        pinch.cy = (p1.y + p2.y)/2;
      }
      const prev = zoom.scale;
      const raw = pinch.startS * (d / (pinch.startD || 1));
      zoom.scale = Math.max(zoom.min, Math.min(zoom.max, raw));
      const k = zoom.scale / prev;
      zoom.x = pinch.cx - k * (pinch.cx - zoom.x);
      zoom.y = pinch.cy - k * (pinch.cy - zoom.y);
      applyZoomTransform();
    }
    if(type==='up'){
      pinch.activeIds.delete(e.pointerId);
      pinch.points.delete(e.pointerId);
      if(pinch.activeIds.size<2){ pinch.inited=false; }
    }
  }

  function applyZoomTransform(){
    const t = `translate(${zoom.x} ${zoom.y}) scale(${zoom.scale})`;
    [gBlobs,gGraph,gCallouts,gLabels,gStamps].forEach(el=> el && el.setAttribute('transform', t));
    updateTouchAction();
  }

  function scrollCanvasIntoView(){
    const wrap = $(".canvas-wrap");
    try{ wrap?.scrollIntoView({behavior:'smooth', block:'nearest'}); }catch(e){/* no-op */}
  }

  function isCategory(key){ return (TAXO.categories||[]).includes(key); }

  function showError(msg){
    const box = $("#err");
    if(!box) return;
    box.textContent = msg;
    box.hidden = false;
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
    Object.entries(TAXO.names||{}).forEach(([sub, arr])=>{
      (arr||[]).forEach(n=> idx.nameToSub[n]=sub);
    });
    Object.entries(TAXO.subgroups||{}).forEach(([grp, arr])=>{
      (arr||[]).forEach(s=> idx.subToGroup[s]=grp);
    });
    Object.entries(TAXO.groups||{}).forEach(([cat, arr])=>{
      (arr||[]).forEach(g=> idx.groupToCat[g]=cat);
    });
  }

  function allSearchKeys(){
    const set = new Set();
    (TAXO.categories||[]).forEach(c=>{
      if(c) set.add(c);
      (TAXO.groups[c]||[]).forEach(g=> set.add(g));
    });
    Object.entries(TAXO.subgroups||{}).forEach(([grp, subs])=>{
      set.add(grp);
      (subs||[]).forEach(s=> set.add(s));
    });
    Object.entries(TAXO.names||{}).forEach(([sub, arr])=>{
      set.add(sub);
      (arr||[]).forEach(n=> set.add(n));
    });
    Object.keys(window.FLAVOR_DATA||{}).forEach(k=> set.add(k));
    return Array.from(set);
  }

  function fillSelect(el, arr){
    const prev = el?.value;
    if(!el) return;
    el.innerHTML = (arr||[]).map(v=>`<option value="${v}">${v}</option>`).join('');
    el.value = (arr||[]).includes(prev)? prev : (arr?.[0] || 'Не выбрано');
  }

  function clearAndMessage(msg){
    ++renderToken;
    gGraph.innerHTML = ""; gLabels.innerHTML=""; gCallouts.innerHTML=""; gBlobs.innerHTML=""; gStamps.innerHTML="";
    centerLabel.textContent = msg;
    const wrap = $(".canvas-wrap").getBoundingClientRect();
    centerLabel.style.left = (wrap.width/2) + "px"; centerLabel.style.top = (wrap.height/2) + "px";
    notesBox.textContent = '—';
  }

  // data helpers
  function nonEmpty(ds){
    if(!ds) return false;
    return (ds.best&&ds.best.length) || (ds.good&&ds.good.length) || (ds.bad&&ds.bad.length) || (ds.unexpected&&ds.unexpected.length);
  }
  function cloneEmpty(){ return { notes:'', best:[], good:[], unexpected:[], bad:[] }; }
  function mergeInto(agg, part){
    if(!part) return;
    ['best','good','bad','unexpected'].forEach(k=>{
      (part[k]||[]).forEach(x=>{
        if(!agg[k].some(y=> y.to===x.to)) agg[k].push({to:x.to, tip:x.tip||''});
      });
    });
    if(part.notes){ agg.notes += (agg.notes? '\n' : '') + part.notes; }
  }
  function aggregateFromChildren(key){
    const agg = cloneEmpty();
    if(TAXO.names[key]){ // subgroup -> collect children names
      (TAXO.names[key]||[]).forEach(nm=>{ if(window.FLAVOR_DATA[nm]) mergeInto(agg, window.FLAVOR_DATA[nm]); });
      return nonEmpty(agg)? agg : null;
    }
    if(TAXO.subgroups[key]){ // group -> collect subgroups and names
      (TAXO.subgroups[key]||[]).forEach(sub=>{
        const subDs = window.FLAVOR_DATA[sub];
        if(nonEmpty(subDs)) mergeInto(agg, subDs);
        (TAXO.names[sub]||[]).forEach(nm=>{ if(window.FLAVOR_DATA[nm]) mergeInto(agg, window.FLAVOR_DATA[nm]); });
      });
      return nonEmpty(agg)? agg : null;
    }
    return null;
  }
  function aggregateFromParents(key){
    const agg = cloneEmpty();
    const sub = reverseIdx.nameToSub[key];
    const grpViaSub = sub ? reverseIdx.subToGroup[sub] : null;
    const grpDirect = reverseIdx.subToGroup[key];
    const grp = grpViaSub || grpDirect;

    if(sub){
      if(nonEmpty(window.FLAVOR_DATA[sub])) mergeInto(agg, window.FLAVOR_DATA[sub]);
      const subAgg = aggregateFromChildren(sub); if(subAgg) mergeInto(agg, subAgg);
    }
    if(grp){
      if(nonEmpty(window.FLAVOR_DATA[grp])) mergeInto(agg, window.FLAVOR_DATA[grp]);
      const grpAgg = aggregateFromChildren(grp); if(grpAgg) mergeInto(agg, grpAgg);
    }
    return nonEmpty(agg) ? agg : null;
  }
  function datasetFor(key){
    const ds = window.FLAVOR_DATA[key];
    if(nonEmpty(ds)) return ds;
    const down = aggregateFromChildren(key);
    if(down) return down;
    const up = aggregateFromParents(key);
    return up || ds || cloneEmpty();
  }

  // geometry
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

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
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
      const path = document.createElementNS("http://www.w3.org/2000/svg","path");
      const ang = startAngle==null ? Math.atan2(b.y-a.y, b.x-a.x) : startAngle;
      path.setAttribute("d", cubicFrom(a,b,ang));
      const classes = ['link', `link-${cat}`, isTrunk?'link-trunk':'link-leaf'];
      path.setAttribute("class", classes.join(' '));
      gGraph.appendChild(path);
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.style.transition = "none";
      path.classList.remove("anim-start");
      requestAnimationFrame(()=>{
        void path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset ${durationMs}ms cubic-bezier(.28,.86,.2,1)`;
        path.classList.add("anim-start");
        path.style.strokeDashoffset = "0";
        setTimeout(()=> resolve(path), durationMs);
      });
    });
  }

  function endpointHalo(p, cat){
    const halo = document.createElementNS("http://www.w3.org/2000/svg","circle");
    halo.setAttribute("cx", p.x); halo.setAttribute("cy", p.y); halo.setAttribute("r", 10);
    halo.setAttribute("class", `dot-halo endpoint-${cat}`);
    gGraph.appendChild(halo);
    return halo;
  }
  function endpoint(p, cat){
    const dot = document.createElementNS("http://www.w3.org/2000/svg","circle");
    dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("r", 6.5);
    dot.setAttribute("class", `endpoint endpoint-${cat}`);
    gGraph.appendChild(dot);
    requestAnimationFrame(()=> requestAnimationFrame(()=> dot.classList.add("show")));
    return dot;
  }

  function twoLineSplit(s){
    const str = String(s||"").trim();
    if(!str) return [""];
    const norm = str.replace(/\//g,' / ').replace(/-/g,' - ');
    const parts = norm.trim().split(/\s+/);
    if(parts.length===1){
      const w = parts[0];
      if(w.length<=12) return [w];
      const mid = Math.floor(w.length/2);
      return [w.slice(0,mid)+"-", w.slice(mid)];
    }
    let best = [str, ""]; let bestScore = Infinity;
    for(let i=1;i<parts.length;i++){
      const l = parts.slice(0,i).join(" ");
      const r = parts.slice(i).join(" ");
      const score = Math.abs(l.length - r.length);
      if(score < bestScore){ bestScore = score; best = [l, r]; }
    }
    return best;
  }

  function label(textStr, pos){
    const g = document.createElementNS("http://www.w3.org/2000/svg","g");
    g.setAttribute("class", "node leaf show");
    g.setAttribute("transform", `translate(${pos.x},${pos.y})`);

    const text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("text-anchor","start");
    const lines = twoLineSplit(String(textStr ?? ""));
    const xoff = 12;
    let dy = 2;
    lines.forEach((ln, idx)=>{
      const tspan = document.createElementNS("http://www.w3.org/2000/svg","tspan");
      tspan.textContent = ln;
      tspan.setAttribute("x", xoff);
      tspan.setAttribute("y", dy);
      tspan.setAttribute("font-size", 14);
      text.appendChild(tspan);
      if(idx===0 && lines.length>1) dy += 16;
    });
    g.appendChild(text);

    const height = (lines.length>1? 44:28);
    const hit = document.createElementNS("http://www.w3.org/2000/svg","rect");
    hit.setAttribute("x", -2); hit.setAttribute("y", -14);
    hit.setAttribute("width", 360); hit.setAttribute("height", height);
    hit.setAttribute("fill", "transparent");
    g.appendChild(hit);

    gLabels.appendChild(g);

    const obj = { g, pos: {...pos}, width: 360, height, anchor: {...pos} };
    labels.push(obj);

    requestAnimationFrame(()=>{
      try{
        if (text && text.getBBox){
          const bb = text.getBBox();
          obj.width  = Math.ceil(bb.width) + 16;
          obj.height = Math.ceil(bb.height) + 8;
        }
      }catch(_){}
    });

    return g;
  }

  function stampAt(p, catKey){
    const g = document.createElementNS("http://www.w3.org/2000/svg","g");
    g.setAttribute("class","stamp");
    const c = document.createElementNS("http://www.w3.org/200/svg","circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 11);
    const t = document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x", p.x); t.setAttribute("y", p.y+0.5);
    let icon = "•"; if(catKey==='best') icon="★"; else if(catKey==='unexpected') icon="!"; else if(catKey==='good') icon="➜";
    t.textContent = icon;
    g.appendChild(c); g.appendChild(t);
    gStamps.appendChild(g);
  }

  function drawBlobs(){
    const blobSpec = [
      {key:'best', x: CENTER.x, y: CENTER.y-240, rx: 240, ry: 140},
      {key:'good', x: CENTER.x+320, y: CENTER.y+40, rx: 260, ry: 150},
      {key:'bad', x: CENTER.x-320, y: CENTER.y+20, rx: 260, ry: 150},
      {key:'unexpected', x: CENTER.x, y: CENTER.y+260, rx: 230, ry: 140},
    ];
    blobSpec.forEach(b=>{
      const e = document.createElementNS("http://www.w3.org/2000/svg","ellipse");
      e.setAttribute("cx", b.x); e.setAttribute("cy", b.y);
      e.setAttribute("rx", b.rx); e.setAttribute("ry", b.ry);
      e.setAttribute("class", `blob blob-${b.key}`);
      gBlobs.appendChild(e);
    });
  }

  function attachInteractivity({ leaf, dot, node, tip, catKey, targetKey }){
    const enter = ()=>{
      const allLinks = gGraph.querySelectorAll('.link');
      allLinks.forEach(p=> p.classList.add('dim'));
      leaf.classList.remove('dim'); leaf.classList.add('is-highlight');
      const trunk = trunks[catKey];
      if(trunk){ trunk.classList.remove('dim'); trunk.classList.add('is-highlight-trunk'); }
    };
    const leave = ()=>{
      const allLinks = gGraph.querySelectorAll('.link');
      allLinks.forEach(p=> p.classList.remove('dim'));
      leaf.classList.remove('is-highlight');
      const trunk = trunks[catKey];
      if(trunk){ trunk.classList.remove('is-highlight-trunk'); }
    };
    node.addEventListener("mouseenter", enter);
    node.addEventListener("mouseleave", leave);
    dot.addEventListener("mouseenter", enter);
    dot.addEventListener("mouseleave", leave);
  }

  function resolveLabelOverlaps(){
    if(labels.length < 2) return;
    const passes = 28;
    for(let pass=0; pass<passes; pass++){
      for(let i=0;i<labels.length;i++){
        for(let j=i+1;j<labels.length;j++){
          const a = labels[i], b = labels[j];
          const ar = rectOf(a), br = rectOf(b);
          const dx = overlap1D(ar.x, ar.x+ar.w, br.x, br.x+br.w);
          const dy = overlap1D(ar.y, ar.y+ar.h, br.y, br.y+br.h);
          if(dx>0 && dy>0){
            const va = vecFromCenter(a.pos); const vb = vecFromCenter(b.pos);
            const step = 1.15 * (1 - pass/passes);
            a.pos.x += va.x*step; a.pos.y += va.y*step;
            b.pos.x += vb.x*step; b.pos.y += vb.y*step;
            a.pos = clampPoint(a.pos);
            b.pos = clampPoint(b.pos);
          }
        }
      }
    }
    labels.forEach(l=>{
      l.g.setAttribute("transform", `translate(${l.pos.x},${l.pos.y})`);
    });
  }
  function rectOf(l){ return { x: l.pos.x-2, y: l.pos.y-14, w: l.width, h: l.height }; }
  function overlap1D(a1, a2, b1, b2){ const left = Math.max(a1,b1), right = Math.min(a2,b2); return Math.max(0, right-left); }
  function vecFromCenter(p){ const dx = p.x - (1600/2), dy = p.y - (1000/2); const len = Math.hypot(dx, dy) || 1; return { x: dx/len, y: dy/len }; }

  async function render(state){
    const myToken = ++renderToken;
    gGraph.innerHTML = ""; gLabels.innerHTML = ""; gCallouts.innerHTML = ""; gBlobs.innerHTML = ""; gStamps.innerHTML = "";
    for(const k in trunks) delete trunks[k];
    labels.length = 0;

    const wrap = $(".canvas-wrap").getBoundingClientRect();
    centerLabel.style.left = (wrap.width/2) + "px";
    centerLabel.style.top  = (wrap.height/2) + "px";
    centerLabel.textContent = state.centerKey;

    const dataset = datasetFor(state.centerKey);
    if(!dataset){ centerLabel.textContent = '—'; return; }

    const groups = META.map(meta => ({
      meta,
      items: (dataset[meta.key] || []).map(p => ({ ...p, category: meta.key, targetKey: p.to }))
    }));

    notesBox.textContent = dataset?.notes || "—";

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
      const spread = Math.min(2.05, 0.95 + Math.log2(count+1)*0.52);
      for(let idx=0; idx<count; idx++){
        const item = items[idx];
        const t = count>1 ? (idx/(count-1)) : 0.5;
        const angle = meta.angle - spread/2 + t*spread + (Math.sin(idx*97.3)*0.06);
        const baseR = LEAF_MIN + (LEAF_MAX-LEAF_MIN) * (0.18 + 0.72*t);
        const jitterR = baseR * (1 + (Math.cos(idx*13.7)*0.06));
        const leafPoint = clampPoint(pointOnAngle(CENTER, angle, jitterR));
        const delay = Math.floor((Math.sin(idx*17.7)+1)*40);
        leafPromises.push(
          new Promise(res=> setTimeout(res, delay)).then(()=> 
            animatePath(hub, leafPoint, meta.key, DUR_LEAF, angle, false).then(async (leaf)=>{
              endpointHalo(leafPoint, meta.key);
              const dot  = endpoint(leafPoint, meta.key);
              const node = label(item.to, leafPoint);
              attachInteractivity({ leaf, dot, node, tip: item.tip, catKey: meta.key, targetKey: item.to });
            })
          )
        );
      }
    }
    await Promise.all(leafPromises);
    if(myToken !== renderToken) return;
    resolveLabelOverlaps();
  }

})();