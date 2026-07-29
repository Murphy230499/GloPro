export const dynamic = 'force-dynamic';
import ClientPage from './_client';

export default async function Page({ params }) { 
  const resolvedParams = await params;
  return <ClientPage staffId={resolvedParams.id} />; 
}
