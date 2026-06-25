const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// ===== 数据库路径 =====
const dbDir = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? process.env.RAILWAY_VOLUME_MOUNT_PATH 
    : path.join(__dirname, '../');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'data.db');
console.log('📂 数据库路径:', dbPath);

// ===== 使用 better-sqlite3 =====
const Database = require('better-sqlite3');

let db;
try {
    db = new Database(dbPath);
    console.log('✅ 数据库连接成功');
} catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
}

// ===== 数据库操作封装 =====
function dbGet(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
}

function dbAll(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}

function dbRun(sql, params = []) {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { lastID: result.lastInsertRowid, changes: result.changes };
}

// ===== 初始化数据库表 =====
function initDatabase() {
    // 用户表
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            join_date TEXT NOT NULL,
            favorites TEXT DEFAULT '[]'
        )
    `);
    console.log('✅ 用户表已就绪');

    // 建筑表
    db.exec(`
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            dynasty TEXT NOT NULL,
            author TEXT NOT NULL,
            poem TEXT,
            description TEXT,
            lng REAL,
            lat REAL
        )
    `);
    console.log('✅ 建筑表已就绪');

    // 评价表
    db.exec(`
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            building_id INTEGER NOT NULL,
            building_name TEXT NOT NULL,
            dynasty TEXT NOT NULL,
            author TEXT NOT NULL,
            rating INTEGER NOT NULL,
            content TEXT NOT NULL,
            likes TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (building_id) REFERENCES buildings(id)
        )
    `);
    console.log('✅ 评价表已就绪');

    // 检查并插入默认数据
    const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get();
    if (buildingCount.count === 0) {
        console.log('📦 插入默认建筑数据...');
        insertDefaultBuildings();
    } else {
        console.log(`📊 已有 ${buildingCount.count} 条建筑数据`);
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE id = "demo1"').get();
    if (userCount.count === 0) {
        console.log('👤 插入默认用户...');
        insertDemoUsers();
    } else {
        console.log('👤 默认用户已存在');
    }
}

// ===== 插入默认建筑数据 =====
function insertDefaultBuildings() {
    const buildings = [
        { id: 1, name: '滕王阁', dynasty: '唐', author: '王勃', 
          poem: '滕王高阁临江渚，佩玉鸣鸾罢歌舞。\n画栋朝飞南浦云，珠帘暮卷西山雨。\n闲云潭影日悠悠，物换星移几度秋。\n阁中帝子今何在？槛外长江空自流。',
          description: '唐代楼阁建筑，位于江西省南昌市，因王勃《滕王阁序》而闻名。',
          lng: 115.8698, lat: 28.6826 },
        { id: 2, name: '黄鹤楼', dynasty: '唐', author: '崔颢',
          poem: '昔人已乘黄鹤去，此地空余黄鹤楼。\n黄鹤一去不复返，白云千载空悠悠。\n晴川历历汉阳树，芳草萋萋鹦鹉洲。\n日暮乡关何处是？烟波江上使人愁。',
          description: '清代楼阁建筑，位于湖北省武汉市，与滕王阁、岳阳楼并称为江南三大名楼。',
          lng: 114.3113, lat: 30.5454 },
        { id: 3, name: '岳阳楼', dynasty: '宋', author: '范仲淹',
          poem: '庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废具兴，乃重修岳阳楼。\n衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。\n先天下之忧而忧，后天下之乐而乐。',
          description: '宋代楼阁建筑，位于湖南省岳阳市，因范仲淹《岳阳楼记》而闻名。',
          lng: 113.0920, lat: 29.3547 },
        { id: 4, name: '寒山寺', dynasty: '唐', author: '张继',
          poem: '月落乌啼霜满天，江枫渔火对愁眠。\n姑苏城外寒山寺，夜半钟声到客船。',
          description: '唐代寺庙建筑，位于江苏省苏州市，因张继《枫桥夜泊》而闻名。',
          lng: 120.5840, lat: 31.2960 },
        { id: 5, name: '西湖', dynasty: '宋', author: '苏轼',
          poem: '水光潋滟晴方好，山色空蒙雨亦奇。\n欲把西湖比西子，淡妆浓抹总相宜。',
          description: '宋代湖泊景观，位于浙江省杭州市，因苏轼《饮湖上初晴后雨》而闻名。',
          lng: 120.1480, lat: 30.2430 },
        { id: 6, name: '白帝城', dynasty: '唐', author: '李白',
          poem: '朝辞白帝彩云间，千里江陵一日还。\n两岸猿声啼不住，轻舟已过万重山。',
          description: '唐代城池遗址，位于重庆市奉节县，因李白《早发白帝城》而闻名。',
          lng: 109.5700, lat: 31.0300 },
        { id: 7, name: '长安', dynasty: '唐', author: '李白',
          poem: '长安一片月，万户捣衣声。\n秋风吹不尽，总是玉关情。\n何日平胡虏，良人罢远征。',
          description: '唐代都城遗址，位于陕西省西安市，是中国历史上建都朝代最多、时间最长的都城。',
          lng: 108.9450, lat: 34.2580 },
        { id: 8, name: '洛阳城', dynasty: '唐', author: '李白',
          poem: '谁家玉笛暗飞声，散入春风满洛城。\n此夜曲中闻折柳，何人不起故园情。',
          description: '唐代都城遗址，位于河南省洛阳市，有5000多年文明史，被誉为"中华第一古都"。',
          lng: 112.4340, lat: 34.6180 },
        { id: 9, name: '泰山', dynasty: '唐', author: '杜甫',
          poem: '岱宗夫如何？齐鲁青未了。\n造化钟神秀，阴阳割昏晓。\n荡胸生曾云，决眦入归鸟。\n会当凌绝顶，一览众山小。',
          description: '五岳之首，位于山东省泰安市，有"五岳独尊"、"天下第一山"之称。',
          lng: 117.1200, lat: 36.2000 },
        { id: 10, name: '庐山', dynasty: '唐', author: '李白',
          poem: '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。',
          description: '人文圣山，位于江西省九江市，以雄、奇、险、秀闻名于世。',
          lng: 115.9850, lat: 29.5700 },
        { id: 11, name: '北固山', dynasty: '宋', author: '辛弃疾',
          poem: '何处望神州？满眼风光北固楼。\n千古兴亡多少事？悠悠。不尽长江滚滚流。',
          description: '京口第一山，位于江苏省镇江市，因辛弃疾《南乡子·登京口北固亭有怀》而闻名。',
          lng: 119.4444, lat: 32.2222 },
        { id: 12, name: '布达拉宫', dynasty: '清', author: '仓央嘉措',
          poem: '住进布达拉宫，我是雪域最大的王。\n流浪在拉萨街头，我是世间最美的情郎。',
          description: '清代宫堡建筑群，位于西藏自治区拉萨市，是世界上海拔最高的宫堡建筑群。',
          lng: 91.1180, lat: 29.6550 }
    ];

    const insert = db.prepare(`
        INSERT OR REPLACE INTO buildings (id, name, dynasty, author, poem, description, lng, lat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((buildings) => {
        for (const b of buildings) {
            insert.run(b.id, b.name, b.dynasty, b.author, b.poem, b.description, b.lng, b.lat);
        }
    });

    insertMany(buildings);
    console.log('✅ 默认建筑数据已插入 (' + buildings.length + ' 条)');
}

// ===== 插入默认用户 =====
function insertDemoUsers() {
    const hash1 = bcrypt.hashSync('libai123', 10);
    const hash2 = bcrypt.hashSync('scholar123', 10);
    
    const users = [
        { id: 'demo1', name: '诗仙李白', email: 'libai@example.com', password: hash1, 
          avatar: 'https://ui-avatars.com/api/?name=李白&background=b8956a&color=fff', 
          join_date: new Date().toISOString(), favorites: '[]' },
        { id: 'demo2', name: '建筑学者', email: 'scholar@example.com', password: hash2, 
          avatar: 'https://ui-avatars.com/api/?name=建筑学者&background=b8956a&color=fff', 
          join_date: new Date().toISOString(), favorites: '[]' }
    ];

    const insert = db.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, password, avatar, join_date, favorites)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((users) => {
        for (const u of users) {
            insert.run(u.id, u.name, u.email, u.password, u.avatar, u.join_date, u.favorites);
        }
    });

    insertMany(users);
    console.log('✅ 默认用户已插入');
}

// ===== 初始化 =====
initDatabase();

// ===== 导出 =====
module.exports = { db, dbGet, dbAll, dbRun };