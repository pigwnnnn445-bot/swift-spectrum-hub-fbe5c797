import { useEffect, useState } from "react";
import { fetchModelsData } from "@/api/modelService";
import type { Provider, ModelConfig } from "@/config/modelConfig";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ProviderListPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      setModels(data.model_list);
    });
  }, []);

  const getModelCount = (providerId: number) =>
    models.filter((m) => m.model_type_id === providerId).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">供应商管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看和管理模型供应商</p>
        </div>
        <Badge variant="secondary">{providers.length} 个供应商</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">图标</TableHead>
              <TableHead>供应商名称</TableHead>
              <TableHead className="text-center">ID</TableHead>
              <TableHead className="text-center">关联模型数</TableHead>
              <TableHead>关联模型</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => {
              const relatedModels = models.filter((m) => m.model_type_id === provider.id);
              return (
                <TableRow key={provider.id} className="hover:bg-muted/30">
                  <TableCell>
                    <img src={provider.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{provider.name}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{provider.id}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{getModelCount(provider.id)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {relatedModels.map((m) => (
                        <Badge key={m.id} variant="outline" className="text-[11px]">
                          {m.name}
                        </Badge>
                      ))}
                      {relatedModels.length === 0 && (
                        <span className="text-xs text-muted-foreground">无关联模型</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProviderListPage;
