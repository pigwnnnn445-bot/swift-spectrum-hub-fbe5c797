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
];

const MasonryGallery = () => {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
      {galleryData.map((item) => (
        <GalleryCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default MasonryGallery;
