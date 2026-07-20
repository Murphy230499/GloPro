export const dynamic = 'force-dynamic';
import ClientPage from './_client';
export default function Page({ params }) { return <ClientPage reviewId={params.id} />; }
