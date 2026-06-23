import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="relative overflow-hidden p-5 group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold mt-1 text-foreground">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}