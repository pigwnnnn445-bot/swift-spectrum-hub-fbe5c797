import GalleryCard, { type GalleryItem } from "./GalleryCard";

import catImg from "@/assets/gallery/cat.jpg";
import animeImg from "@/assets/gallery/anime-girl.jpg";
import cyberpunkImg from "@/assets/gallery/cyberpunk-city.jpg";
import dragonImg from "@/assets/gallery/dragon.jpg";
import zenImg from "@/assets/gallery/zen-garden.jpg";
import portraitImg from "@/assets/gallery/portrait.jpg";
import underwaterImg from "@/assets/gallery/underwater.jpg";
import owlImg from "@/assets/gallery/steampunk-owl.jpg";
import auroraImg from "@/assets/gallery/aurora.jpg";
import foodImg from "@/assets/gallery/food.jpg";
import astronautImg from "@/assets/gallery/astronaut.jpg";
import corgiImg from "@/assets/gallery/corgi.jpg";

const galleryData: GalleryItem[] = [
  { id: 1, image: catImg, type: "pet", title: "可爱猫咪", description: "一只戴着眼镜的橙色小猫，工作室照明，暖色调", height: 280 },
  { id: 2, image: cyberpunkImg, type: "landscape", title: "赛博城市", description: "未来赛博朋克城市夜景，霓虹灯在湿润街道上反射，飞行器穿梭", height: 320 },
  { id: 3, image: animeImg, type: "illustration", title: "幻想少女", description: "蓝色长发的动漫少女在幻想花园中，空灵的光线，精致的插画风格", height: 360 },
  { id: 4, image: dragonImg, type: "illustration", title: "金色巨龙", description: "金色巨龙盘旋在暴风云中，奇幻数字绘画，戏剧性光影", height: 300 },
  { id: 5, image: zenImg, type: "landscape", title: "禅意花园", description: "宁静的日式禅意花园，樱花盛开，锦鲤游弋，石灯笼", height: 260 },
  { id: 6, image: portraitImg, type: "portrait", title: "金色时刻", description: "雀斑少女的肖像，金色夕阳光线，浅景深，自然美", height: 340 },
  { id: 7, image: underwaterImg, type: "landscape", title: "深海珊瑚", description: "水下珊瑚礁场景，热带鱼群和水母，清澈海水", height: 280 },
  { id: 8, image: owlImg, type: "illustration", title: "蒸汽猫头鹰", description: "蒸汽朋克机械猫头鹰栖息在齿轮上，铜色调，精密零件", height: 320 },
  { id: 9, image: auroraImg, type: "landscape", title: "极光之夜", description: "北极光倒映在冰冻湖面，雪山环绕，绿紫交织", height: 260 },
  { id: 10, image: foodImg, type: "image", title: "巧克力蛋糕", description: "精致的巧克力蛋糕配莓果和金叶装饰，暗调美食摄影", height: 300 },
  { id: 11, image: astronautImg, type: "image", title: "太空漫步", description: "宇航员漂浮在太空中，地球为背景，星云和星辰", height: 340 },
  { id: 12, image: corgiImg, type: "pet", title: "向日葵柯基", description: "可爱的柯基犬在向日葵田中奔跑，金色阳光", height: 280 },
  { id: 13, image: cyberpunkImg, type: "landscape", title: "霓虹巷道", description: "雨后的赛博朋克小巷，地面倒映着霓虹招牌，蒸汽升腾", height: 300 },
  { id: 14, image: catImg, type: "pet", title: "午后猫咪", description: "慵懒的橘猫趴在窗台上晒太阳，柔和的侧光", height: 260 },
  { id: 15, image: zenImg, type: "landscape", title: "竹林小径", description: "静谧的竹林小径，阳光透过竹叶洒落斑驳光影", height: 340 },
  { id: 16, image: dragonImg, type: "illustration", title: "冰霜之龙", description: "冰蓝色巨龙在雪山之巅呼啸，冰晶飞舞，极寒氛围", height: 280 },
  { id: 17, image: portraitImg, type: "portrait", title: "晨雾少女", description: "清晨薄雾中的少女侧影，逆光剪影，梦幻氛围", height: 320 },
  { id: 18, image: underwaterImg, type: "landscape", title: "深海水母", description: "发光水母群在深海中漂浮，生物荧光，幽蓝色调", height: 300 },
  { id: 19, image: owlImg, type: "illustration", title: "机械飞鸟", description: "精密的机械鸟展翅飞翔，齿轮与羽毛交织，蒸汽朋克美学", height: 260 },
  { id: 20, image: auroraImg, type: "landscape", title: "星空帐篷", description: "极光下的野外露营，帐篷内透出温暖灯光，银河横跨天际", height: 340 },
  { id: 21, image: foodImg, type: "image", title: "抹茶甜点", description: "精致的日式抹茶甜点拼盘，和风器皿，清新配色", height: 280 },
  { id: 22, image: astronautImg, type: "image", title: "月球基地", description: "宇航员站在月球表面远眺地球，科幻建筑群落", height: 320 },
  { id: 23, image: animeImg, type: "illustration", title: "星空少女", description: "少女仰望星空，发丝随风飘动，星尘围绕，唯美插画", height: 300 },
  { id: 24, image: corgiImg, type: "pet", title: "雪地柯基", description: "柯基在雪地中欢快奔跑，雪花纷飞，冬日暖阳", height: 260 },
  { id: 25, image: catImg, type: "pet", title: "星空猫咪", description: "猫咪坐在屋顶仰望星空，月光洒落，宁静夜晚", height: 340 },
  { id: 26, image: cyberpunkImg, type: "landscape", title: "未来都市", description: "高楼林立的未来城市全景，飞行列车穿梭，科技感十足", height: 280 },
  { id: 27, image: zenImg, type: "landscape", title: "枫叶庭院", description: "秋日日式庭院，红枫倒映在池塘中，宁静致远", height: 300 },
];

interface MasonryGalleryProps {
  onUsePrompt?: (prompt: string) => void;
}

const MasonryGallery = ({ onUsePrompt }: MasonryGalleryProps) => {
  return (
    <div>
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
        {galleryData.map((item) => (
          <GalleryCard key={item.id} item={item} onUsePrompt={onUsePrompt} />
        ))}
      </div>
      <p className="mt-10 mb-4 text-center text-sm text-workspace-muted">
        ✨ 灵感不等人，现在就动笔，让你的作品闪耀登场～
      </p>
    </div>
  );
};

export default MasonryGallery;
