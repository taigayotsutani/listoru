import { Users, AlertTriangle, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardsProps {
  totalCount: number;
  meoWeakCount: number;
  noWebsiteCount: number;
}

export function SummaryCards({
  totalCount,
  meoWeakCount,
  noWebsiteCount,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">総抽出件数</p>
              <p className="text-2xl font-bold text-foreground">
                {totalCount} 件
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MEO弱者</p>
              <p className="text-2xl font-bold text-destructive">
                {meoWeakCount} 件
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">サイトなし</p>
              <p className="text-2xl font-bold text-foreground">
                {noWebsiteCount} 件
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
