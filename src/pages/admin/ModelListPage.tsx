import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchModelsData } from "@/api/modelService";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Check, X } from "lucide-react";

const FlagBadge = ({ value }: { value: number }) => (
  value === 1
    ? <Check className="h-4 w-4 text-emerald-600" />
    : <X className="h-4 w-4 text-muted-foreground/40" />
);

const ModelListPage = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModelsData().then((data) => {
      setModels(data.model_list);
      setProviders(data.provider_list);
    });
  }, []);

  const getProviderName = (id: number) =>
    providers.find((p) => p.id === id)?.name ?? `ID:${id}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">模型管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有模型配置及功能开关</p>
        </div>
        <Badge variant="secondary">{models.length} 个模型</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">图标</TableHead>
              <TableHead>模型名称</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead className="text-center">价格</TableHead>
              <TableHead className="text-center">比例</TableHead>
              <TableHead className="text-center">分辨率</TableHead>
              <TableHead className="text-center">风格</TableHead>
              <TableHead className="text-center">参考图</TableHead>
              <TableHead className="text-center">生成数量</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} className="hover:bg-muted/30">
                <TableCell>
                  <img src={model.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium text-foreground">{model.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.content}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getProviderName(model.model_type_id)}
                </TableCell>
                <TableCell className="text-center text-sm">{model.price}</TableCell>
                <TableCell className="text-center"><FlagBadge value={model.ratio_flg} /></TableCell>
                <TableCell className="text-center"><FlagBadge value={model.resolution_flg} /></TableCell>
                <TableCell className="text-center"><FlagBadge value={model.style_flg} /></TableCell>
                <TableCell className="text-center"><FlagBadge value={model.image_reference_flg} /></TableCell>
                <TableCell className="text-center text-sm">
                  {model.image_num > 0 ? `最多${model.image_num}` : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={model.show_flg === 1 ? "default" : "secondary"} className="text-[11px]">
                    {model.show_flg === 1 ? "上线" : "下线"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/models/${model.id}`)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ModelListPage;
