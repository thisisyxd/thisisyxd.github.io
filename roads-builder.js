// ==================== 道路生成逻辑 ====================
// 此文件包含从roads/加载数据并生成图结构的逻辑

function generateCityRoads(cityName, ewRoads, nsRoads) {
    const nodes = {};
    const roads = [];
    let nodeIdCounter = 0;
    const ewNodes = [];
    const nsNodes = [];

    ewRoads.forEach((road) => {
        const lineNodes = [];
        const y = road.y;

        for (let x = road.startX; x <= road.endX; x += 10) {
            const id = `${cityName}_${nodeIdCounter++}`;
            nodes[id] = { x: x, y: y, city: cityName };
            lineNodes.push(id);
        }

        for (let i = 0; i < lineNodes.length - 1; i++) {
            roads.push({ from: lineNodes[i], to: lineNodes[i + 1], level: road.level });
        }
        ewNodes.push(lineNodes);
    });

    nsRoads.forEach((road) => {
        const lineNodes = [];
        const x = road.x;

        for (let y = road.startY; y <= road.endY; y += 10) {
            const id = `${cityName}_${nodeIdCounter++}`;
            nodes[id] = { x: x, y: y, city: cityName };
            lineNodes.push(id);
        }

        for (let i = 0; i < lineNodes.length - 1; i++) {
            roads.push({ from: lineNodes[i], to: lineNodes[i + 1], level: road.level });
        }
        nsNodes.push(lineNodes);
    });

    ewNodes.forEach((ewLine, ewIdx) => {
        nsNodes.forEach((nsLine, nsIdx) => {
            ewLine.forEach(ewNodeId => {
                nsLine.forEach(nsNodeId => {
                    const ewNode = nodes[ewNodeId];
                    const nsNode = nodes[nsNodeId];
                    const dist = Math.hypot(ewNode.x - nsNode.x, ewNode.y - nsNode.y);

                    if (dist < 10) {
                        const avgX = (ewNode.x + nsNode.x) / 2;
                        const avgY = (ewNode.y + nsNode.y) / 2;
                        ewNode.x = avgX;
                        ewNode.y = avgY;
                        nsNode.x = avgX;
                        nsNode.y = avgY;
                        roads.push({
                            from: ewNodeId,
                            to: nsNodeId,
                            level: Math.min(ewRoads[ewIdx].level, nsRoads[nsIdx].level)
                        });
                    }
                });
            });
        });
    });

    return { nodes, roads };
}

function resolvePoint(point, snapDistance = 50) {
    if (typeof point === 'string') {
        if (allNodes[point]) {
            return { nodeId: point, ...allNodes[point] };
        }
        return null;
    }

    if (Array.isArray(point) && point.length === 2) {
        const [x, y] = point;

        for (const [nodeId, node] of Object.entries(allNodes)) {
            if (Math.abs(node.x - x) < 1 && Math.abs(node.y - y) < 1) {
                return { nodeId, ...node };
            }
        }

        let nearest = null;
        let minDist = Infinity;

        for (const [nodeId, node] of Object.entries(allNodes)) {
            if (node.isStation || node.isRailwayNode) continue;

            const dist = Math.hypot(node.x - x, node.y - y);
            if (dist < minDist && dist <= snapDistance) {
                minDist = dist;
                nearest = { nodeId, ...node, distance: dist };
            }
        }

        if (nearest) return nearest;

        const nodeId = `_conn_${x}_${y}_${Date.now()}`;
        allNodes[nodeId] = { x, y, city: 'connection' };
        return { nodeId, x, y, isNew: true };
    }

    return null;
}

function createConnection(pointA, pointB, level = 2, options = {}) {
    const opts = {
        createNodes: true,
        snapDistance: 50,
        waypoints: [],
        ...options
    };

    const start = resolvePoint(pointA, opts.snapDistance);
    const end = resolvePoint(pointB, opts.snapDistance);

    if (!start || !end) return null;

    const points = [start, ...opts.waypoints.map((wp, idx) => {
        const resolved = resolvePoint(wp, opts.snapDistance);
        if (!resolved) {
            const nodeId = `_waypoint_${Date.now()}_${idx}`;
            allNodes[nodeId] = { x: wp[0], y: wp[1], city: 'connection' };
            return { nodeId, x: wp[0], y: wp[1], isNew: true };
        }
        return resolved;
    }), end];

    const createdRoads = [];
    for (let i = 0; i < points.length - 1; i++) {
        const from = points[i];
        const to = points[i + 1];

        const exists = allRoads.some(r =>
            (r.from === from.nodeId && r.to === to.nodeId) ||
            (r.from === to.nodeId && r.to === from.nodeId)
        );

        if (exists) continue;

        const road = { from: from.nodeId, to: to.nodeId, level: level };
        allRoads.push(road);
        createdRoads.push(road);
    }

    return { start, end, roads: createdRoads };
}

// ==================== 构建图数据 ====================
let allNodes = {};
let allRoads = [];
const stationNodes = {};

const cityData = { A, B, C, D, E, F, G, H };

Object.entries(cityData).forEach(([name, data]) => {
    const result = generateCityRoads(name, data.ewRoads, data.nsRoads);
    Object.assign(allNodes, result.nodes);
    allRoads.push(...result.roads);
});

// 铁路
Object.entries(railway.stations).forEach(([key, station]) => {
    const nodeId = `station_${key}`;
    stationNodes[nodeId] = {
        x: station.x,
        y: station.y,
        city: station.city,
        isStation: true,
        stationName: station.name,
        boardCost: station.boardCost
    };
    allNodes[nodeId] = stationNodes[nodeId];
});

Object.entries(railway.midpoints).forEach(([key, pos]) => {
    allNodes[key] = {
        x: pos.x,
        y: pos.y,
        city: 'railway',
        isRailwayNode: true
    };
});

railway.lines.forEach(([from, to]) => {
    if (allNodes[from] && allNodes[to]) {
        allRoads.push({ from, to, level: 0, isRailway: true });
    }
});

// 地铁
Object.entries(metro).forEach(([cityName, cityData]) => {
    Object.entries(cityData.stations).forEach(([stationId, station]) => {
        const nodeId = `metro_${cityName}_${stationId}`;
        allNodes[nodeId] = {
            x: station.x,
            y: station.y,
            city: cityName,
            isMetro: true,
            stationName: `${cityName}线${stationId}`,
            metroRailway: !!station.railway
        };
    });

    Object.entries(cityData.sequences).forEach(([lineId, sequence]) => {
        const resolved = [];
        sequence.forEach((item, idx) => {
            if (typeof item === 'string') {
                const station = cityData.stations[item];
                if (!station) return;
                resolved.push(`metro_${cityName}_${item}`);
            } else if (Array.isArray(item) && item.length === 2) {
                const wpId = `metro_wp_${cityName}_${lineId}_${idx}`;
                allNodes[wpId] = { x: item[0], y: item[1], city: cityName, isMetroWaypoint: true };
                resolved.push(wpId);
            }
        });

        for (let i = 0; i < resolved.length - 1; i++) {
            allRoads.push({ from: resolved[i], to: resolved[i + 1], level: -2, isMetro: true, lineId: lineId });
        }
    });
});

// 地铁出入口
Object.entries(metro).forEach(([cityName, cityData]) => {
    Object.entries(cityData.stations).forEach(([stationId, station]) => {
        const stationNodeId = `metro_${cityName}_${stationId}`;
        station.entrances.forEach((entrance, idx) => {
            if (!entrance.x || !entrance.y) return;
            const entId = `metro_ent_${cityName}_${stationId}_${entrance.name}`;
            allNodes[entId] = {
                x: entrance.x,
                y: entrance.y,
                city: cityName,
                isMetroEntrance: true
            };
            allRoads.push({
                from: entId,
                to: stationNodeId,
                level: -3,
                isMetro: true,
                isMetroEntrance: true
            });
        });
    });
});

// 连接道路
connection_roads.forEach(conn => {
    createConnection(conn.from, conn.to, conn.level);
});

// 导出到全局
window.allNodes = allNodes;
window.allRoads = allRoads;
window.stations = stationNodes;
window.createConnection = createConnection;
window.metro = metro;
