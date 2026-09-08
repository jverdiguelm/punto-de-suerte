import {redirect,notFound} from 'next/navigation'
import {isAdmin} from '@/lib/adminAuth'
import {adminSupabase} from '@/lib/supabase'
import RafflePreview from '@/components/RafflePreview'

export const dynamic='force-dynamic'
export default async function Preview({params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())redirect('/admin')
  const {slug}=await params
  const db=adminSupabase()
  const {data:r}=await db.from('raffles').select('*').eq('slug',slug).single()
  if(!r)notFound()
  const raffle={...r,price:(r.price_cents||0)/100}
  return <main className="wrap">
    <div className="previewTopbar"><a className="btn secondary" href={`/admin/rifas/${slug}`}>← Volver a editar</a><span><b>Vista previa completa</b> · no acepta apartados</span></div>
    <RafflePreview raffle={raffle} banner/>
  </main>
}
