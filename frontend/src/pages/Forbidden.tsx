import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';

const Forbidden = () => (
  <>
    <Header title="Không có quyền truy cập" />
    <main className="flex flex-1 items-center justify-center p-6">
      <div role="alert" className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold">Bạn không có quyền truy cập</h2>
        <p className="text-muted-foreground">Trang này chỉ dành cho vai trò có thẩm quyền. Nếu cần truy cập, hãy liên hệ quản trị viên.</p>
        <Button size="lg" render={<Link to="/dashboard" />} nativeButton={false} className="mt-2 h-10 px-4">
          Về Tổng quan
        </Button>
      </div>
    </main>
  </>
);

export default Forbidden;
