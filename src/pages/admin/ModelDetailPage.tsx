import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchModelsData } from "@/api/modelService";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, X } from "lucide-react";

const Flag = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-1.5">
      {value === 1 ? (
        <Badge variant="default" className="text-[11px] gap-1"><Check className="h-3 w-3" />启用</Badge>
      ) : (
        <Badge variant="secondary" className="text-[11px] gap-1"><X className="h-3 w-3" />禁用</Badge>
      )}
    </div>
  </div>
);

const PriceField = ({ label, price }: { label: string; price: number }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{price} 积分</span>
  </div>
);

const ModelDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<ModelConfig | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      const found = data.model_list.find((m) => m.id === Number(id));
      setModel(found ?? null);
    });
  }, [id]);

  if (!model) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const providerName = providers.find((p) => p.id === model.model_type_id)?.name ?? `ID:${model.model_type_id}`;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/models")} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <img src={model.image} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{model.name}</h1>
            <p className="text-sm text-muted-foreground">{providerName} · ID: {model.id}</p>
          </div>
        </div>
        <Badge variant={model.show_flg === 1 ? "default" : "secondary"} className="ml-auto">
          {model.show_flg === 1 ? "上线" : "下线"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-border">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">模型描述</span>
              <span className="text-sm text-foreground max-w-[200px] text-right">{model.content}</span>
            </div>
            <PriceField label="基础价格" price={model.price} />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Midjourney 模型</span>
              <span className="text-sm">{model.is_mj ? "是" : "否"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">生成数量上限</span>
              <span className="text-sm">{model.image_num > 0 ? model.image_num : "不可配置"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">功能开关</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-border">
            <Flag label="比例选择" value={model.ratio_flg} />
            <Flag label="分辨率选择" value={model.resolution_flg} />
            <Flag label="风格选择" value={model.style_flg} />
            <Flag label="参考图上传" value={model.image_reference_flg} />
            <Flag label="下载" value={model.download_flg} />
            <Flag label="编辑提示词" value={model.edit_prompt_flg} />
            <Flag label="放大图片" value={model.enlarge_picture_flg} />
            <Flag label="重新生成" value={model.regenerate_flg} />
            <Flag label="移除背景" value={model.remove_background_flg} />
            <Flag label="局部重绘" value={model.inpaint_flg} />
            <Flag label="编辑图像" value={model.edit_image_flg} />
          </CardContent>
        </Card>

        {/* Ratio */}
        {model.ratio_flg === 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">比例配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {model.ratio.map((r) => (
                  <Badge key={r} variant="outline">{r}</Badge>
                ))}
              </div>
              {model.ratio_price > 0 && (
                <p className="text-xs text-muted-foreground mt-2">附加价格: {model.ratio_price} 积分</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resolution */}
        {model.resolution_flg === 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">分辨率配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {model.resolution.map((r) => (
                  <div key={r.resolution} className="flex items-center justify-between">
                    <Badge variant="outline">{r.resolution}</Badge>
                    <span className="text-xs text-muted-foreground">+{r.price} 积分</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Styles */}
        {model.style_flg === 1 && model.style.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">风格配置 ({model.style.flatMap(t => t.resource).length} 种)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {model.style.flatMap((tab) =>
                  tab.resource.map((res) => (
                    <div key={res.id} className="flex flex-col items-center gap-1.5">
                      <img
                        src={res.image}
                        alt={res.resource_name}
                        className="h-16 w-16 rounded-lg object-cover border border-border"
                      />
                      <span className="text-[11px] text-muted-foreground text-center leading-tight">
                        {res.resource_name}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {model.style_price > 0 && (
                <p className="text-xs text-muted-foreground mt-3">附加价格: {model.style_price} 积分</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Image Like / Reference */}
        {model.image_like.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">图片参考类型</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border">
              {model.image_like.map((item, i) => {
                const typeLabels: Record<number, string> = { 1: "人物参考", 3: "风格参考", 4: "图像参考" };
                return (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      {typeLabels[item.like_type] ?? `类型${item.like_type}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.image_like_flg === 1 ? "default" : "secondary"} className="text-[11px]">
                        {item.image_like_flg === 1 ? "启用" : "禁用"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {item.more_image_flg === 1 ? "多图" : "单图"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Action Prices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">操作价格</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-border">
            <PriceField label="下载" price={model.download_price} />
            <PriceField label="编辑提示词" price={model.edit_prompt_price} />
            <PriceField label="放大图片" price={model.enlarge_picture_price} />
            <PriceField label="重新生成" price={model.regenerate_price} />
            <PriceField label="移除背景" price={model.remove_background_price} />
            <PriceField label="参考图上传" price={model.image_reference_price} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModelDetailPage;
