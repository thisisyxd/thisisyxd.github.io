// ==================== 地铁系统数据 ====================
// 按城市组织，每条线路包含：配置、车站、线路走向、标识位置

const metro = {
    A: {
        lines: {
            'A1': { name: 'A1号线', color: '#e53e3e', class: 'metro-line-a1', number: '1' },
            'A2': { name: 'A2号线', color: '#3182ce', class: 'metro-line-a2', number: '2' },
            'A3': { name: 'A3号线', color: '#68d391', class: 'metro-line-a3', number: '3' },
            'A4': { name: 'A4号线', color: '#d6bcfa', class: 'metro-line-a4', number: '4' }
        },
        stations: {
            'A1_1': { x: -344, y: -48, dir: 'NS', entrances: [{ name: 'A', x: -316, y: -48 }] },
            'A1_2': { x: -344, y: 8, dir: 'NS', entrances: [{ name: 'A', x: -351, y: 7 }, { name: 'B', x: -349, y: 17 }], transfer: ['A4_4'] },
            'A1_3': { x: -344, y: 47, dir: 'NS', entrances: [{ name: 'A', x: -351, y: 47 }] },
            'A1_4': { x: -344, y: 82, dir: 'NS', entrances: [{ name: 'A', x: -344, y: 94 }, { name: 'B', x: -318, y: 86 }, { name: 'C', x: -317, y: 78 }], transfer: ['A2_3'] },
            'A1_5': { x: -344, y: 148, dir: 'NS', entrances: [{ name: 'A', x: -346, y: 159 }], railway: true, transfer: ['A3_1'] },
            'A1_6': { x: -344, y: 192, dir: 'NS', entrances: [{ name: 'A', x: -358, y: 189 }, { name: 'B', x: -373, y: 200 }] },
            'A2_1': { x: -420, y: 135, dir: 'EW', entrances: [{ name: 'A', x: -444, y: 135 }] },
            'A2_2': { x: -371, y: 108, dir: 'NS', entrances: [{ name: 'A', x: -376, y: 108 }] },
            'A2_3': { x: -340, y: 82, dir: 'EW', entrances: [{ name: 'A', x: -344, y: 94 }, { name: 'B', x: -318, y: 86 }, { name: 'C', x: -317, y: 78 }], transfer: ['A1_4'] },
            'A2_4': { x: -305, y: 83, dir: 'EW', entrances: [{ name: 'A', x: -311, y: 85 }, { name: 'B', x: -309, y: 95 }], transfer: ['A3_2'] },
            'A2_5': { x: -272, y: 107, dir: 'NS', entrances: [{ name: 'A', x: -279, y: 108 }] },
            'A2_6': { x: -226, y: 113, dir: 'EW', entrances: [{ name: 'A', x: -225, y: 110 }] },
            'A3_1': { x: -332, y: 130, dir: 'EW', entrances: [{ name: 'A', x: -346, y: 159 }], railway: true, transfer: ['A1_5'] },
            'A3_2': { x: -299, y: 103, dir: 'NS', entrances: [{ name: 'A', x: -311, y: 85 }, { name: 'B', x: -309, y: 95 }], transfer: ['A2_4'] },
            'A3_3': { x: -299, y: 44, dir: 'NS', entrances: [{ name: 'A', x: -294, y: 44 }, { name: 'B', x: -294, y: 47 }] },
            'A3_4': { x: -299, y: 7, dir: 'NS', entrances: [{ name: 'A', x: -294, y: 10 }, { name: 'B', x: -274, y: 9 }], transfer: ['A4_3'] },
            'A3_5': { x: -299, y: -30, dir: 'NS', entrances: [{ name: 'A', x: -290, y: -40 }] },
            'A4_1': { x: -232, y: 29, dir: 'NS', entrances: [{ name: 'A', x: -229, y: 32 }], railway: true },
            'A4_2': { x: -247, y: 18, dir: 'EW', entrances: [{ name: 'A', x: -244, y: 9 }, { name: 'B', x: -239, y: 8 }] },
            'A4_3': { x: -295, y: 18, dir: 'EW', entrances: [{ name: 'A', x: -294, y: 10 }, { name: 'B', x: -274, y: 9 }], transfer: ['A3_4'] },
            'A4_4': { x: -353, y: 18, dir: 'EW', entrances: [{ name: 'A', x: -351, y: 7 }, { name: 'B', x: -349, y: 17 }], transfer: ['A1_2'] },
            'A4_5': { x: -399, y: 18, dir: 'EW', entrances: [{ name: 'A', x: -399, y: 24 }] }
        },
        sequences: {
            'A1': ['A1_1', 'A1_2', 'A1_3', 'A1_4', 'A1_5', 'A1_6'],
            'A2': ['A2_1', [-371, 135], 'A2_2', [-371, 82], 'A2_3', 'A2_4', [-272, 82], 'A2_5', [-271, 113], 'A2_6'],
            'A3': ['A3_1', [-299, 130], 'A3_2', 'A3_3', 'A3_4', 'A3_5'],
            'A4': ['A4_1', [-232, 24], [-237, 20], 'A4_2', 'A4_3', 'A4_4', 'A4_5']
        },
        markers: {
            'A1': { x: -344, y: -20 },
            'A2': { x: -391, y: 135 },
            'A3': { x: -300, y: 70 },
            'A4': { x: -280, y: 18 }
        }
    },
    B: {
        lines: {
            'B1': { name: 'B1号线', color: '#fc8181', class: 'metro-line-b1', number: '1' },
            'B2': { name: 'B2号线', color: '#4299e1', class: 'metro-line-b2', number: '2' },
            'B3': { name: 'B3号线', color: '#8b4513', class: 'metro-line-b3', number: '3' }
        },
        stations: {
            'B1_1': { x: 545, y: -714, dir: 'NS', entrances: [{ name: 'A', x: 557, y: -681 }], railway: true, transfer: ['B3_1'] },
            'B1_2': { x: 576, y: -688, dir: 'EW', entrances: [{ name: 'A', x: 576, y: -679 }] },
            'B1_3': { x: 613, y: -688, dir: 'EW', entrances: [{ name: 'A', x: 613, y: -708 }] },
            'B1_4': { x: 643, y: -731, dir: 'NS', entrances: [{ name: 'A', x: 638, y: -708 }, { name: 'B', x: 635, y: -702 }], transfer: ['B2_2'] },
            'B1_5': { x: 662, y: -749, dir: 'EW', entrances: [], transfer: ['B3_5'] },
            'B2_1': { x: 629, y: -681, dir: 'NS', entrances: [{ name: 'A', x: 620, y: -681 }] },
            'B2_2': { x: 629, y: -722, dir: 'NS', entrances: [{ name: 'A', x: 638, y: -708 }, { name: 'B', x: 635, y: -702 }], transfer: ['B1_4'] },
            'B2_3': { x: 629, y: -754, dir: 'NS', entrances: [{ name: 'A', x: 628, y: -753 }], transfer: ['B3_4'] },
            'B2_4': { x: 629, y: -785, dir: 'NS', entrances: [{ name: 'A', x: 640, y: -785 }] },
            'B2_5': { x: 629, y: -821, dir: 'NS', entrances: [{ name: 'A', x: 635, y: -829 }, { name: 'B', x: 629, y: -830 }] },
            'B3_1': { x: 552, y: -714, dir: 'NS', entrances: [{ name: 'A', x: 557, y: -681 }], railway: true, transfer: ['B1_1'] },
            'B3_2': { x: 566, y: -739, dir: 'EW', entrances: [{ name: 'A', x: 566, y: -730 }] },
            'B3_3': { x: 593, y: -739, dir: 'EW', entrances: [{ name: 'A', x: 597, y: -730 }] },
            'B3_4': { x: 624, y: -739, dir: 'EW', entrances: [{ name: 'A', x: 628, y: -753 }], transfer: ['B2_3'] },
            'B3_5': { x: 655, y: -739, dir: 'EW', entrances: [], transfer: ['B1_5'] }
        },
        sequences: {
            'B1': ['B1_1', [544, -696], [551, -688], 'B1_2', 'B1_3', [629, -688], [639, -699], 'B1_4', [646, -745], 'B1_5'],
            'B2': ['B2_1', 'B2_2', 'B2_3', 'B2_4', 'B2_5'],
            'B3': ['B3_1', [554, -731], [560, -739], 'B3_2', 'B3_3', 'B3_4', 'B3_5']
        },
        markers: {
            'B1': { x: 544, y: -705 },
            'B2': { x: 628, y: -775 },
            'B3': { x: 555, y: -730 }
        }
    },
    C: {
        lines: {
            'C1': { name: 'C1号线', color: '#9b2c2c', class: 'metro-line-c1', number: '1' }
        },
        stations: {
            'C1_1': { x: -192, y: -241, dir: 'EW', entrances: [{ name: 'A', x: -192, y: -249 }] },
            'C1_2': { x: -237, y: -241, dir: 'EW', entrances: [{ name: 'A', x: -241, y: -230 }], railway: true },
            'C1_3': { x: -265, y: -241, dir: 'EW', entrances: [{ name: 'A', x: -265, y: -266 }] },
            'C1_4': { x: -306, y: -231, dir: 'EW', entrances: [{ name: 'A', x: -287, y: -246 }, { name: 'B', x: -288, y: -246 }] }
        },
        sequences: {
            'C1': ['C1_1', 'C1_2', 'C1_3', [-306, -241], 'C1_4']
        },
        markers: {
            'C1': { x: -220, y: -241 }
        }
    }
};
