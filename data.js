// data.js - 数据管理

// ===== 建筑数据（包含 poem 和 desc 用于详情页） =====
var BUILDINGS = [
    { 
        id: 1, name: "滕王阁", dynasty: "唐", author: "王勃",
        poem: "滕王高阁临江渚，佩玉鸣鸾罢歌舞。\n画栋朝飞南浦云，珠帘暮卷西山雨。\n闲云潭影日悠悠，物换星移几度秋。\n阁中帝子今何在？槛外长江空自流。",
        desc: "唐代楼阁建筑，位于江西省南昌市，因王勃《滕王阁序》而闻名。"
    },
    { 
        id: 2, name: "黄鹤楼", dynasty: "唐", author: "崔颢",
        poem: "昔人已乘黄鹤去，此地空余黄鹤楼。\n黄鹤一去不复返，白云千载空悠悠。\n晴川历历汉阳树，芳草萋萋鹦鹉洲。\n日暮乡关何处是？烟波江上使人愁。",
        desc: "清代楼阁建筑，位于湖北省武汉市，与滕王阁、岳阳楼并称为江南三大名楼。"
    },
    { 
        id: 3, name: "岳阳楼", dynasty: "宋", author: "范仲淹",
        poem: "庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废具兴，乃重修岳阳楼。\n衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。\n先天下之忧而忧，后天下之乐而乐。",
        desc: "宋代楼阁建筑，位于湖南省岳阳市，因范仲淹《岳阳楼记》而闻名。"
    },
    { 
        id: 4, name: "寒山寺", dynasty: "唐", author: "张继",
        poem: "月落乌啼霜满天，江枫渔火对愁眠。\n姑苏城外寒山寺，夜半钟声到客船。",
        desc: "唐代寺庙建筑，位于江苏省苏州市，因张继《枫桥夜泊》而闻名。"
    },
    { 
        id: 5, name: "西湖", dynasty: "宋", author: "苏轼",
        poem: "水光潋滟晴方好，山色空蒙雨亦奇。\n欲把西湖比西子，淡妆浓抹总相宜。",
        desc: "宋代湖泊景观，位于浙江省杭州市，因苏轼《饮湖上初晴后雨》而闻名。"
    },
    { 
        id: 6, name: "白帝城", dynasty: "唐", author: "李白",
        poem: "朝辞白帝彩云间，千里江陵一日还。\n两岸猿声啼不住，轻舟已过万重山。",
        desc: "唐代城池遗址，位于重庆市奉节县，因李白《早发白帝城》而闻名。"
    },
    { 
        id: 7, name: "长安", dynasty: "唐", author: "李白",
        poem: "长安一片月，万户捣衣声。\n秋风吹不尽，总是玉关情。\n何日平胡虏，良人罢远征。",
        desc: "唐代都城遗址，位于陕西省西安市，是中国历史上建都朝代最多、时间最长的都城。"
    },
    { 
        id: 8, name: "洛阳城", dynasty: "唐", author: "李白",
        poem: "谁家玉笛暗飞声，散入春风满洛城。\n此夜曲中闻折柳，何人不起故园情。",
        desc: "唐代都城遗址，位于河南省洛阳市，有5000多年文明史，被誉为'中华第一古都'。"
    },
    { 
        id: 9, name: "泰山", dynasty: "唐", author: "杜甫",
        poem: "岱宗夫如何？齐鲁青未了。\n造化钟神秀，阴阳割昏晓。\n荡胸生曾云，决眦入归鸟。\n会当凌绝顶，一览众山小。",
        desc: "五岳之首，位于山东省泰安市，有'五岳独尊'、'天下第一山'之称。"
    },
    { 
        id: 10, name: "庐山", dynasty: "唐", author: "李白",
        poem: "日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。",
        desc: "人文圣山，位于江西省九江市，以雄、奇、险、秀闻名于世。"
    },
    { 
        id: 11, name: "北固山", dynasty: "宋", author: "辛弃疾",
        poem: "何处望神州？满眼风光北固楼。\n千古兴亡多少事？悠悠。不尽长江滚滚流。",
        desc: "京口第一山，位于江苏省镇江市，因辛弃疾《南乡子·登京口北固亭有怀》而闻名。"
    },
    { 
        id: 12, name: "布达拉宫", dynasty: "清", author: "仓央嘉措",
        poem: "住进布达拉宫，我是雪域最大的王。\n流浪在拉萨街头，我是世间最美的情郎。",
        desc: "清代宫堡建筑群，位于西藏自治区拉萨市，是世界上海拔最高的宫堡建筑群。"
    }
];

// ===== 评价管理 =====
function getReviews() {
    try {
        var data = localStorage.getItem('reviews');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveReviews(reviews) {
    localStorage.setItem('reviews', JSON.stringify(reviews));
}

function addReview(review) {
    var reviews = getReviews();
    reviews.unshift(review);
    saveReviews(reviews);
    return review;
}

function toggleLike(reviewId, userId) {
    var reviews = getReviews();
    var review = null;
    for (var i = 0; i < reviews.length; i++) {
        if (reviews[i].id === reviewId) {
            review = reviews[i];
            break;
        }
    }
    if (!review) return false;
    if (!review.likes) review.likes = [];
    var idx = review.likes.indexOf(userId);
    if (idx > -1) {
        review.likes.splice(idx, 1);
    } else {
        review.likes.push(userId);
    }
    saveReviews(reviews);
    return true;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ===== 初始化示例数据 =====
function initDemoReviews() {
    var existing = getReviews();
    if (existing.length === 0) {
        var now = Date.now();
        var demo = [
            {
                id: 'demo1',
                userId: 'demo1',
                buildingId: 1,
                buildingName: '滕王阁',
                dynasty: '唐',
                author: '王勃',
                rating: 5,
                content: '滕王阁果然名不虚传！站在阁上远眺，仿佛能感受到王勃当年"落霞与孤鹜齐飞，秋水共长天一色"的壮阔景象。',
                likes: ['demo2'],
                createdAt: new Date(now - 3600000 * 2).toISOString()
            },
            {
                id: 'demo2',
                userId: 'demo1',
                buildingId: 2,
                buildingName: '黄鹤楼',
                dynasty: '唐',
                author: '崔颢',
                rating: 5,
                content: '黄鹤楼最令人震撼的是它的空间层次感。从楼顶眺望长江，浩浩汤汤，气象万千。',
                likes: [],
                createdAt: new Date(now - 3600000 * 5).toISOString()
            },
            {
                id: 'demo3',
                userId: 'demo2',
                buildingId: 3,
                buildingName: '岳阳楼',
                dynasty: '宋',
                author: '范仲淹',
                rating: 4,
                content: '岳阳楼最打动我的是范仲淹"先天下之忧而忧，后天下之乐而乐"的家国情怀。',
                likes: ['demo1'],
                createdAt: new Date(now - 3600000 * 24).toISOString()
            }
        ];
        saveReviews(demo);
    }
}

// 暴露全局
window.BUILDINGS = BUILDINGS;
window.getReviews = getReviews;
window.saveReviews = saveReviews;
window.addReview = addReview;
window.toggleLike = toggleLike;
window.generateId = generateId;
window.initDemoReviews = initDemoReviews;