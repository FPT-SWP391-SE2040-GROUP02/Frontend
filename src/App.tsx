import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                SWP
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl font-bold">SWP391 Ready!</CardTitle>
            <Badge variant="secondary">v1.0</Badge>
          </div>
          <CardDescription>
            Vite + React 19 + Tailwind v4 + Shadcn UI (Base UI Nova)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quick Test Input</label>
            <Input placeholder="Nhập thử nội dung..." />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => alert("Outline button clicked!")}>
            Hủy
          </Button>
          <Button onClick={() => alert("Thành công! Các components đã sẵn sàng.")}>
            Bắt đầu phát triển
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
