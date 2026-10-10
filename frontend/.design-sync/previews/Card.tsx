import { Button, Badge, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'frontend';

export const DayDu = () => (
  <div style={{ width: 380 }}>
    <Card>
      <CardHeader>
        <CardTitle>KPI Quý 3/2026</CardTitle>
        <CardDescription>Phòng Kinh doanh — kỳ đánh giá 01/07 – 30/09</CardDescription>
        <CardAction>
          <Badge status="canh-bao" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0 }}>Hoàn thành 4/6 chỉ tiêu. Còn 2 chỉ tiêu cần cập nhật số liệu trước ngày 05/10.</p>
      </CardContent>
      <CardFooter style={{ gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="outline" size="sm">Xem chi tiết</Button>
        <Button size="sm">Cập nhật</Button>
      </CardFooter>
    </Card>
  </div>
);

export const GonSm = () => (
  <div style={{ width: 320 }}>
    <Card size="sm">
      <CardHeader>
        <CardTitle>Ghi chú của quản lý</CardTitle>
        <CardDescription>Cập nhật 2 giờ trước</CardDescription>
      </CardHeader>
      <CardContent>Cần bổ sung minh chứng cho chỉ tiêu doanh thu.</CardContent>
    </Card>
  </div>
);
