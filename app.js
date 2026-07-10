// ==================== 配置 ====================
const CONFIG = {
    mapBounds: { min: -1500, max: 1500 },
    viewBounds: { min: -2500, max: 2500 },
    zoom: { min: 0.3, max: 10, step: 0.15 },
    labelHideZoom: 1.8,
    priorities: { 0: 6, 3: 3, 2: 2, 1: 1.5 },
    sampleInterval: 5,
    connectionSnapDistance: 50,
    railwayPenalty: 50
};

let state = {
    mode: 'view',
    navMode: '',
    startPoint: null,
    endPoint: null,
    zoom: 1,
    viewCenter: { x: 0, y: 0 },
    isPanning: false,
    lastMouse: { x: 0, y: 0 }
};

// ==================== 构建图结构 ====================
const graph = {};
const samplePoints = [];

Object.keys(allNodes).forEach(key => {
    graph[key] = [];
});

allRoads.forEach(road => {
    const p1 = allNodes[road.from];
    const p2 = allNodes[road.to];
    
    if (!p1 || !p2) return;
    
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const priority = CONFIG.priorities[road.level] || 1;
    const weight = dist / priority;
    
    graph[road.from].push({ 
        to: road.to, 
        dist, 
        weight, 
        level: road.level, 
        isRailway: road.level === 0 
    });
    graph[road.to].push({ 
        to: road.from, 
        dist, 
        weight, 
        level: road.level, 
        isRailway: road.level === 0 
    });
    
    if (road.level !== 0) {
        const steps = Math.max(2, Math.floor(dist / CONFIG.sampleInterval));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            samplePoints.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t,
                nodeA: road.from,
                nodeB: road.to,
                t: t,
                level: road.level
            });
        }
    }
});

// 添加换乘边：只有车站可以换乘，铁路中间节点不可换乘
Object.entries(stationNodes).forEach(([stationId, station]) => {
    let nearestRoadNode = null;
    let minDist = Infinity;
    
    for (const [nodeId, node] of Object.entries(allNodes)) {
        if (node.isStation || node.isRailwayNode || nodeId.startsWith('station_') || nodeId.startsWith('midpoint_')) continue;
        
        const dist = Math.hypot(node.x - station.x, node.y - station.y);
        if (dist < minDist && dist <= 15) {
            minDist = dist;
            nearestRoadNode = nodeId;
        }
    }
    
    if (nearestRoadNode) {
        const penaltyWeight = CONFIG.railwayPenalty / CONFIG.priorities[3];
        
        graph[nearestRoadNode].push({ 
            to: stationId, 
            dist: minDist, 
            weight: penaltyWeight,
            level: -1,
            isTransfer: true,
            transferType: 'board'
        });
        
        graph[stationId].push({ 
            to: nearestRoadNode, 
            dist: minDist, 
            weight: 0.1,
            level: -1,
            isTransfer: true,
            transferType: 'alight'
        });
    }
});

// ==================== 初始化地图 ====================
function initMap() {
    const roadsLayer = document.getElementById('roads-layer');
    const railwayLayer = document.getElementById('railway-layer');
    const stationsLayer = document.getElementById('stations-layer');
    
    allRoads.forEach(road => {
        const p1 = allNodes[road.from];
        const p2 = allNodes[road.to];
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        
        if (road.level === 0) {
            line.setAttribute('class', 'road-railway');
            railwayLayer.appendChild(line);
        } else {
            line.setAttribute('class', `road-${['railway', 'secondary', 'primary', 'highway'][road.level]}`);
            roadsLayer.appendChild(line);
        }
    });
    
    Object.entries(stationNodes).forEach(([nodeId, station]) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', station.x);
        circle.setAttribute('cy', station.y);
                circle.setAttribute('class', 'station-marker');
                circle.setAttribute('r', 4);
                stationsLayer.appendChild(circle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', station.x);
        text.setAttribute('y', station.y - 12);
        text.setAttribute('class', 'station-label');
        text.textContent = station.stationName;
        stationsLayer.appendChild(text);
    });
}

function setMode(newMode, e) {
    state.mode = newMode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const navControls = document.getElementById('navControls');
    const container = document.getElementById('map-container');
    const info = document.getElementById('info');
    
    if (newMode === 'view') {
        navControls.classList.remove('visible');
        container.classList.remove('nav-mode');
        container.classList.add('view-mode');
        info.textContent = '查看模式：滚轮缩放，拖拽平移';
        clearAll();
    } else {
        navControls.classList.add('visible');
        container.classList.remove('view-mode');
        container.classList.add('nav-mode');
        info.textContent = '点击"起点"后在道路上点击';
    }
}

function setNavMode(navMode) {
    state.navMode = navMode;
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${navMode}`).classList.add('active');
    document.getElementById('info').textContent = 
        navMode === 'start' ? '在道路上点击设置起点' : '在道路上点击设置终点';
}

function screenToSvg(screenX, screenY) {
    const svg = document.getElementById('map');
    const pt = svg.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function getExactPosition(clientX, clientY) {
    const svgP = screenToSvg(clientX, clientY);
    
    if (svgP.x < CONFIG.mapBounds.min || svgP.x > CONFIG.mapBounds.max ||
        svgP.y < CONFIG.mapBounds.min || svgP.y > CONFIG.mapBounds.max) {
        return null;
    }
    
    let nearest = null;
    let minDist = Infinity;
    const searchRadius = 60 / state.zoom;
    
    for (let sample of samplePoints) {
        const dist = Math.hypot(sample.x - svgP.x, sample.y - svgP.y);
        if (dist < minDist && dist < searchRadius) {
            minDist = dist;
            nearest = sample;
        }
    }
    
    if (!nearest) return null;
    
    return {
        x: nearest.x,
        y: nearest.y,
        nodeA: nearest.nodeA,
        nodeB: nearest.nodeB,
        t: nearest.t,
        level: nearest.level
    };
}

function updateViewBox() {
    const mapSize = CONFIG.mapBounds.max - CONFIG.mapBounds.min;
    const halfW = mapSize / (2 * state.zoom);
    const halfH = mapSize / (2 * state.zoom);
    
    state.viewCenter.x = Math.max(
        CONFIG.viewBounds.min + halfW,
        Math.min(CONFIG.viewBounds.max - halfW, state.viewCenter.x)
    );
    state.viewCenter.y = Math.max(
        CONFIG.viewBounds.min + halfH,
        Math.min(CONFIG.viewBounds.max - halfH, state.viewCenter.y)
    );
    
    const w = mapSize / state.zoom;
    const h = mapSize / state.zoom;
    const x = state.viewCenter.x - w / 2;
    const y = state.viewCenter.y - h / 2;
    
    document.getElementById('map').setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    
    const shouldHideLabels = state.zoom > CONFIG.labelHideZoom;
    document.querySelectorAll('.city-label').forEach(label => {
        if (shouldHideLabels) {
            label.classList.add('hidden');
        } else {
            label.classList.remove('hidden');
        }
    });
}

function zoom(factor) {
    const newZoom = Math.max(CONFIG.zoom.min, Math.min(CONFIG.zoom.max, state.zoom * factor));
    state.zoom = newZoom;
    updateViewBox();
}

const container = document.getElementById('map-container');

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? (1 - CONFIG.zoom.step) : (1 + CONFIG.zoom.step);
    const newZoom = Math.max(CONFIG.zoom.min, Math.min(CONFIG.zoom.max, state.zoom * factor));
    const oldZoom = state.zoom;

    const mouseSvg = screenToSvg(e.clientX, e.clientY);
    const mapSize = CONFIG.mapBounds.max - CONFIG.mapBounds.min;
    const oldW = mapSize / oldZoom;
    const newW = mapSize / newZoom;
    const oldVbx = state.viewCenter.x - oldW / 2;
    const oldVby = state.viewCenter.y - oldW / 2;

    state.zoom = newZoom;
    state.viewCenter.x = mouseSvg.x - (mouseSvg.x - oldVbx) * oldZoom / newZoom + newW / 2;
    state.viewCenter.y = mouseSvg.y - (mouseSvg.y - oldVby) * oldZoom / newZoom + newW / 2;

    updateViewBox();
}, { passive: false });

container.addEventListener('click', (e) => {
    if (state.mode !== 'nav' || !state.navMode) return;
    if (touchState.processedTap) {
        touchState.processedTap = false;
        return;
    }
    const pos = getExactPosition(e.clientX, e.clientY);
    if (!pos) {
        document.getElementById('info').textContent = '请点击道路附近';
        return;
    }
    
    if (state.navMode === 'start') {
        state.startPoint = pos;
        updateMarker('marker-start', pos.x, pos.y);
        document.getElementById('info').textContent = '起点已设置，请设置终点';
        document.getElementById('btn-start').classList.remove('active');
        state.navMode = '';
    } else if (state.navMode === 'end') {
        state.endPoint = pos;
        updateMarker('marker-end', pos.x, pos.y);
        document.getElementById('info').textContent = '终点已设置，点击"导航"';
        document.getElementById('btn-end').classList.remove('active');
        state.navMode = '';
    }
});

container.addEventListener('mousedown', (e) => {
    state.isPanning = true;
    state.lastMouse = { x: e.clientX, y: e.clientY };
    container.style.cursor = state.mode === 'view' ? 'grabbing' : 'move';
});

document.addEventListener('mousemove', (e) => {
    if (!state.isPanning) return;
    
    const dx = (e.clientX - state.lastMouse.x) / state.zoom * 2;
    const dy = (e.clientY - state.lastMouse.y) / state.zoom * 2;
    
    state.viewCenter.x -= dx;
    state.viewCenter.y -= dy;
    state.lastMouse = { x: e.clientX, y: e.clientY };
    
    updateViewBox();
});

document.addEventListener('mouseup', () => {
    state.isPanning = false;
    container.style.cursor = state.mode === 'view' ? 'grab' : 'crosshair';
});

container.addEventListener('mousemove', (e) => {
    const svgP = screenToSvg(e.clientX, e.clientY);
    const coordDisplay = document.getElementById('coordDisplay');
    if (coordDisplay) {
        coordDisplay.textContent = `X: ${Math.round(svgP.x)}  Y: ${Math.round(svgP.y)}`;
    }
});

// ==================== 移动端触摸支持 ====================
let touchState = {
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    startTime: 0,
    fingerCount: 0,
    isPanning: false,
    pinchDist: 0,
    processedTap: false
};

container.addEventListener('touchstart', (e) => {
    touchState.fingerCount = e.touches.length;
    touchState.startX = e.touches[0].clientX;
    touchState.startY = e.touches[0].clientY;
    touchState.lastX = e.touches[0].clientX;
    touchState.lastY = e.touches[0].clientY;
    touchState.startTime = Date.now();
    touchState.isPanning = false;

    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchState.pinchDist = Math.hypot(dx, dy);
    }
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchState.lastX;
        const dy = e.touches[0].clientY - touchState.lastY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            touchState.isPanning = true;
        }
        state.viewCenter.x -= dx / state.zoom * 6;
        state.viewCenter.y -= dy / state.zoom * 6;
        touchState.lastX = e.touches[0].clientX;
        touchState.lastY = e.touches[0].clientY;
        updateViewBox();
    } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (touchState.pinchDist > 0) {
            const factor = dist / touchState.pinchDist;
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const newZoom = Math.max(CONFIG.zoom.min, Math.min(CONFIG.zoom.max, state.zoom * factor));
            const oldZoom = state.zoom;
            const mouseSvg = screenToSvg(midX, midY);
            const mapSize = CONFIG.mapBounds.max - CONFIG.mapBounds.min;
            const oldW = mapSize / oldZoom;
            const newW = mapSize / newZoom;
            const oldVbx = state.viewCenter.x - oldW / 2;
            const oldVby = state.viewCenter.y - oldW / 2;
            state.zoom = newZoom;
            state.viewCenter.x = mouseSvg.x - (mouseSvg.x - oldVbx) * oldZoom / newZoom + newW / 2;
            state.viewCenter.y = mouseSvg.y - (mouseSvg.y - oldVby) * oldZoom / newZoom + newW / 2;
            updateViewBox();
        }
        touchState.pinchDist = dist;
        touchState.isPanning = true;
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (touchState.fingerCount === 1 && !touchState.isPanning) {
        const elapsed = Date.now() - touchState.startTime;
        if (elapsed < 300 && state.mode === 'nav' && state.navMode) {
            const pos = getExactPosition(touchState.startX, touchState.startY);
            if (!pos) {
                document.getElementById('info').textContent = '请点击道路附近';
            } else if (state.navMode === 'start') {
                state.startPoint = pos;
                touchState.processedTap = true;
                updateMarker('marker-start', pos.x, pos.y);
                document.getElementById('info').textContent = '起点已设置，请设置终点';
                document.getElementById('btn-start').classList.remove('active');
                state.navMode = '';
            } else if (state.navMode === 'end') {
                state.endPoint = pos;
                touchState.processedTap = true;
                updateMarker('marker-end', pos.x, pos.y);
                document.getElementById('info').textContent = '终点已设置，点击"导航"';
                document.getElementById('btn-end').classList.remove('active');
                state.navMode = '';
            }
        }
    }
    touchState.pinchDist = 0;
});

function updateMarker(id, x, y) {
    const marker = document.getElementById(id);
    marker.style.display = 'block';
    marker.setAttribute('transform', `translate(${x},${y})`);
}

// ==================== 寻路算法 ====================
function findRoute() {
    if (!state.startPoint || !state.endPoint) {
        alert('请先设置起点和终点！');
        return;
    }
    
    const start = state.startPoint;
    const end = state.endPoint;
    
    const result = findPathWithRailway(start, end);
    
    if (!result || result.path.length < 2) {
        document.getElementById('info').textContent = '寻路失败，请检查道路是否连通';
        return;
    }
    
    drawRoute(result.path);
    
    let infoText = `路线：${result.actualDistance.toFixed(0)}格`;
    if (result.usesRailway) {
        infoText += `（需乘坐火车，请合理规划时间）`;
    }
    document.getElementById('info').textContent = infoText;
}

function findPathWithRailway(start, end) {
    const tempGraph = {};
    
    Object.keys(graph).forEach(key => {
        tempGraph[key] = [...graph[key]];
    });
    
    const startId = '_start_';
    const endId = '_end_';
    
    tempGraph[startId] = [];
    tempGraph[endId] = [];
    
    const startDistA = Math.hypot(allNodes[start.nodeA].x - start.x, allNodes[start.nodeA].y - start.y);
    const startDistB = Math.hypot(allNodes[start.nodeB].x - start.x, allNodes[start.nodeB].y - start.y);
    
    tempGraph[startId].push({ to: start.nodeA, dist: startDistA, weight: startDistA, level: start.level });
    tempGraph[startId].push({ to: start.nodeB, dist: startDistB, weight: startDistB, level: start.level });
    tempGraph[start.nodeA].push({ to: startId, dist: startDistA, weight: startDistA, level: start.level });
    tempGraph[start.nodeB].push({ to: startId, dist: startDistB, weight: startDistB, level: start.level });
    
    const endDistA = Math.hypot(allNodes[end.nodeA].x - end.x, allNodes[end.nodeA].y - end.y);
    const endDistB = Math.hypot(allNodes[end.nodeB].x - end.x, allNodes[end.nodeB].y - end.y);
    
    tempGraph[end.nodeA].push({ to: endId, dist: endDistA, weight: endDistA, level: end.level });
    tempGraph[end.nodeB].push({ to: endId, dist: endDistB, weight: endDistB, level: end.level });
    
    const dist = {};
    const prev = {};
    const unvisited = new Set();
    const edgeInfo = {};
    
    Object.keys(tempGraph).forEach(n => {
        dist[n] = Infinity;
        unvisited.add(n);
    });
    dist[startId] = 0;
    
    while (unvisited.size > 0) {
        let u = null;
        let min = Infinity;
        for (let n of unvisited) {
            if (dist[n] < min) {
                min = dist[n];
                u = n;
            }
        }
        
        if (u === null || u === endId) break;
        unvisited.delete(u);
        
        for (let neighbor of tempGraph[u]) {
            if (!unvisited.has(neighbor.to)) continue;
            const alt = dist[u] + neighbor.weight;
            if (alt < dist[neighbor.to]) {
                dist[neighbor.to] = alt;
                prev[neighbor.to] = u;
                edgeInfo[neighbor.to] = neighbor;
            }
        }
    }
    
    if (dist[endId] === Infinity) return null;
    
    const nodePath = [endId];
    const edges = [];
    let u = endId;
    while (prev[u]) {
        edges.unshift(edgeInfo[u]);
        u = prev[u];
        nodePath.unshift(u);
    }
    
    const coordPath = [];
    let usesRailway = false;
    let actualDistance = 0;
    
    for (let i = 0; i < nodePath.length; i++) {
        const id = nodePath[i];
        if (id === '_start_') {
            coordPath.push({ x: start.x, y: start.y });
        } else if (id === '_end_') {
            coordPath.push({ x: end.x, y: end.y });
        } else if (allNodes[id]) {
            coordPath.push({ x: allNodes[id].x, y: allNodes[id].y });
        }
    }
    
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (edge.isRailway) {
            usesRailway = true;
            actualDistance += edge.dist;
        } else if (!edge.isTransfer) {
            actualDistance += edge.dist;
        }
    }
    
    actualDistance += Math.hypot(coordPath[1].x - coordPath[0].x, coordPath[1].y - coordPath[0].y);
    actualDistance += Math.hypot(coordPath[coordPath.length-1].x - coordPath[coordPath.length-2].x, 
                                 coordPath[coordPath.length-1].y - coordPath[coordPath.length-2].y);
    
    return {
        path: coordPath,
        usesRailway,
        actualDistance,
        totalWeight: dist[endId]
    };
}

function drawRoute(points) {
    const d = points.map((p, i) => 
        `${i===0?'M':'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    ).join(' ');
    
    document.getElementById('route').setAttribute('d', d);
    document.getElementById('route').style.display = 'block';
}

function clearAll() {
    state.startPoint = null;
    state.endPoint = null;
    state.navMode = '';
    document.getElementById('marker-start').style.display = 'none';
    document.getElementById('marker-end').style.display = 'none';
    document.getElementById('route').style.display = 'none';
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    if (state.mode === 'nav') {
        document.getElementById('info').textContent = '点击"起点"后在道路上点击';
    }
}

initMap();
updateViewBox();
