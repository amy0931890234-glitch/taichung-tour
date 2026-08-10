const fs = require('fs');
const path = require('path');

const placemarks = [
    // 🏨 住宿飯店與據點
    { name: "Hyatt Regency Reston (Base 1)", lat: 38.9587, lng: -77.3570, layer: "🏨 住宿飯店與據點", desc: "Day 1-3 住宿據點，交通生活機能優良" },
    { name: "Skyland Lodge (Shenandoah)", lat: 38.5921, lng: -78.3809, layer: "🏨 住宿飯店與據點", desc: "Day 3 仙納度國家公園小木屋，位於 Skyline Drive 最佳觀星點" },
    { name: "The George Washington Hotel", lat: 39.1843, lng: -78.1636, layer: "🏨 住宿飯店與據點", desc: "Day 4 溫徹斯特歷史風格飯店" },
    { name: "Hyatt Place State College", lat: 40.7934, lng: -77.8600, layer: "🏨 住宿飯店與據點", desc: "Day 5 賓州州立大學城飯店" },
    { name: "Watkins Glen Harbor Hotel", lat: 42.3812, lng: -76.8725, layer: "🏨 住宿飯店與據點", desc: "Day 6-7 塞內卡湖畔五星級湖景飯店" },
    { name: "Hyatt Place Niagara Falls", lat: 43.0858, lng: -79.0614, layer: "🏨 住宿飯店與據點", desc: "Day 8 步行至尼加拉瀑布公園僅 5 分鐘" },
    { name: "The Industrialist Hotel Pittsburgh", lat: 40.4406, lng: -79.9959, layer: "🏨 住宿飯店與據點", desc: "Day 9 匹茲堡市中心精品歷史飯店" },
    { name: "Penn Wells Hotel", lat: 41.7476, lng: -77.2964, layer: "🏨 住宿飯店與據點", desc: "Day 10 落水山莊周邊特色旅宿" },
    { name: "Residence Inn Rosslyn Arlington", lat: 38.8951, lng: -77.0712, layer: "🏨 住宿飯店與據點", desc: "Day 11-16 華盛頓DC據點，附廚房與便利停車" },

    // 🚗 Day 1-3 華盛頓DC & 仙納度公園
    { name: "Washington Dulles Airport (IAD)", lat: 38.9531, lng: -77.4565, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "起飛與降落國際機場，取車還車地點" },
    { name: "Silver Diner Reston", lat: 38.9542, lng: -77.3601, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "美式夜宵與熱牛肉湯餐廳" },
    { name: "Great Falls Park (大瀑布國家公園)", lat: 38.9986, lng: -77.2541, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "波托馬克河巨石瀑布奇景與 Billy Goat Trail" },
    { name: "Skyline Drive Thornton Gap Entrance", lat: 38.6607, lng: -78.3211, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "仙納度國家公園全景景觀道路入口" },
    { name: "Stony Man Trail Summit Overlook", lat: 38.5982, lng: -78.3734, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "輕鬆步道，俯瞰藍嶺山脈絕美落日" },
    { name: "Old Rag Mountain Trailhead", lat: 38.5707, lng: -78.2869, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "傳奇花崗岩巨石攀爬健行峰頂" },
    { name: "Big Meadows Lodge", lat: 38.5181, lng: -78.4367, layer: "🚗 Day 1-3 華盛頓DC & 仙納度公園", desc: "大草原景觀區與 Spottswood 餐廳" },

    // 🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖
    { name: "Luray Caverns (盧雷鐘乳石洞)", lat: 38.6644, lng: -78.4839, layer: "🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖", desc: "美東規模最大鐘乳石地底奇觀與地下管風琴" },
    { name: "Gettysburg National Military Park", lat: 39.8142, lng: -77.2312, layer: "🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖", desc: "蓋提斯堡南北戰爭歷史紀念國家公園" },
    { name: "The Amish Farm and House", lat: 40.0275, lng: -76.2163, layer: "🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖", desc: "蘭開斯特阿米什傳統農莊體驗與馬車體驗" },
    { name: "Shady Maple Smorgasbord", lat: 40.1065, lng: -76.0272, layer: "🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖", desc: "全美最大美式自助餐美食饗宴" },
    { name: "Corning Museum of Glass", lat: 42.1432, lng: -77.0543, layer: "🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖", desc: "世界頂級康寧玻璃藝術博物館與吹玻璃表演" },
    { name: "Watkins Glen State Park Gorge Trail", lat: 42.3756, lng: -76.8732, layer: "🌲 Day 4-6 鐘乳石洞, 賓州農莊與五指湖", desc: "五指湖最震撼的 19 座瀑布峽谷步道" },

    // 🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡
    { name: "Taughannock Falls State Park", lat: 42.5358, lng: -76.6001, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "落差達 65 公尺（超越尼加拉瀑布單體落差）的高空瀑布" },
    { name: "Cornell University (康乃爾大學)", lat: 42.4534, lng: -76.4735, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "藤校校園巡禮、McGraw Tower 與峽谷吊橋" },
    { name: "Letchworth State Park (美東大峽谷)", lat: 42.5701, lng: -77.9744, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "美東大峽谷壯麗三層大瀑布奇觀" },
    { name: "Niagara Falls State Park", lat: 43.0815, lng: -79.0642, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "霧中少女號 (Maid of the Mist) 與風之洞 (Cave of the Winds)" },
    { name: "Top of the Falls Restaurant", lat: 43.0822, lng: -79.0689, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "全美唯一座落於馬蹄瀑布旁的全景美景餐廳" },
    { name: "Presque Isle State Park (Erie)", lat: 42.1601, lng: -80.1118, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "伊利湖天然沙洲半島與夕陽觀景台" },
    { name: "Duquesne Incline (匹茲堡纜車)", lat: 40.4398, lng: -80.0181, layer: "🌊 Day 7-11 綺色佳, 尼加拉瀑布 & 匹茲堡", desc: "百年復古纜車，登頂俯瞰三河交會夜景" },

    // 🏛 Day 12-14 落水山莊 & 華盛頓DC文化
    { name: "Fallingwater (落水山莊)", lat: 39.9063, lng: -79.4678, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "Frank Lloyd Wright 現代建築大師經典世界遺產作品" },
    { name: "Kentuck Knob", lat: 39.8732, lng: -79.5218, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "有機建築代表作與雕塑公園" },
    { name: "Natural Bridge State Park (VA)", lat: 37.6284, lng: -79.5447, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "高達 66 公尺的天然巨石拱橋奇觀" },
    { name: "Smithsonian National Museum of Natural History", lat: 38.8913, lng: -77.0261, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "史密森尼國立自然歷史博物館（藍鑽與恐龍化石）" },
    { name: "United States Botanic Garden", lat: 38.8887, lng: -77.0127, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "美國國家植物園溫室與溫帶花園" },
    { name: "National Mall & Washington Monument", lat: 38.8895, lng: -77.0352, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "國家廣場大草坪與華盛頓紀念碑" },
    { name: "Old Ebbitt Grill", lat: 38.8979, lng: -77.0331, layer: "🏛 Day 12-14 落水山莊 & 華盛頓DC文化", desc: "DC 百年歷史政治名流海鮮餐廳" },

    // 🛍 Day 15-17 購物, 喬治城 & 返程
    { name: "Georgetown Historic District", lat: 38.9051, lng: -77.0628, layer: "🛍 Day 15-17 購物, 喬治城 & 返程", desc: "喬治城古蹟街區、獨立小店與河畔景觀" },
    { name: "Old Town Alexandria Waterfront", lat: 38.8048, lng: -77.0423, layer: "🛍 Day 15-17 購物, 喬治城 & 返程", desc: "亞歷山卓古鎮港口與石板路歷史街區" },
    { name: "REI Co-op DC Flagship Store", lat: 38.9056, lng: -77.0042, layer: "🛍 Day 15-17 購物, 喬治城 & 返程", desc: "美東最大 REI 戶外用品旗艦店" },
    { name: "Fashion Centre at Pentagon City", lat: 38.8624, lng: -77.0592, layer: "🛍 Day 15-17 購物, 喬治城 & 返程", desc: "大華府區購物中心與品牌採購" },
    { name: "National Air and Space Museum Udvar-Hazy Center", lat: 38.9108, lng: -77.4442, layer: "🛍 Day 15-17 購物, 喬治城 & 返程", desc: "展出發現號太空梭與 SR-71 黑鳥偵察機之巨型航太館" }
];

// Helper to escape XML special chars
function xmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Group by layer
const layers = {};
placemarks.forEach(p => {
    if (!layers[p.layer]) layers[p.layer] = [];
    layers[p.layer].push(p);
});

// Build KML
let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>2026 美東 17 天自然與建築自駕公路旅行</name>
    <description>包含景點、飯店、美景與自駕據點標記，可直接匯入 Google 我的地圖 (Google My Maps)</description>
`;

for (const [layerName, items] of Object.entries(layers)) {
    kml += `    <Folder>\n      <name>${xmlEscape(layerName)}</name>\n`;
    items.forEach(item => {
        kml += `      <Placemark>
        <name>${xmlEscape(item.name)}</name>
        <description>${xmlEscape(item.desc)}</description>
        <Point>
          <coordinates>${item.lng},${item.lat},0</coordinates>
        </Point>
      </Placemark>\n`;
    });
    kml += `    </Folder>\n`;
}

kml += `  </Document>\n</kml>`;

// Build CSV
let csv = `Name,Latitude,Longitude,Category,Description\n`;
placemarks.forEach(p => {
    csv += `"${p.name.replace(/"/g, '""')}",${p.lat},${p.lng},"${p.layer.replace(/"/g, '""')}","${p.desc.replace(/"/g, '""')}"\n`;
});

const baseDir = __dirname;
fs.writeFileSync(path.join(baseDir, 'us_east_trip_2026_mymaps.kml'), kml, 'utf8');
fs.writeFileSync(path.join(baseDir, 'us_east_trip_2026_mymaps.csv'), csv, 'utf8');

console.log('Successfully generated clean UTF-8 KML & CSV files!');
