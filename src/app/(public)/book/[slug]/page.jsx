export const dynamic = 'force-dynamic';
import ClientPage from './_client';

export async function generateMetadata({ params }) {
  return {
    title: 'Đặt lịch hẹn | GloPro',
    description: 'Đặt lịch dịch vụ làm đẹp trực tuyến nhanh chóng và tiện lợi',
  };
}

export default async function BookSlugPage({ params }) {
  const { slug } = await params;
  return <ClientPage slug={slug} />;
}
