import {NextResponse} from 'next/server'
import {isAdmin} from '@/lib/adminAuth'
import {adminSupabase} from '@/lib/supabase'

export async function POST(_:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false,error:'No autorizado'},{status:401})
  try{
    const {slug}=await params,db=adminSupabase()
    const {data:r,error:re}=await db.from('raffles').select('id,status').eq('slug',slug).single();if(re)throw re
    if(r.status!=='draft')return NextResponse.json({ok:false,error:'Solo puedes limpiar pruebas en borradores.'},{status:400})
    const {data:ps,error:pe}=await db.from('participants').select('id').eq('raffle_id',r.id).eq('is_test',true);if(pe)throw pe
    const ids=(ps||[]).map((x:any)=>x.id)
    if(ids.length){
      const {error:ue}=await db.from('raffle_numbers').update({status:'available',reserved_until:null,participant_id:null}).eq('raffle_id',r.id).in('participant_id',ids);if(ue)throw ue
      const {error:paymentError}=await db.from('payments').delete().eq('raffle_id',r.id).eq('is_test',true)
      if(paymentError)throw paymentError
      const {error:de}=await db.from('participants').delete().eq('raffle_id',r.id).eq('is_test',true);if(de)throw de
    }
    return NextResponse.json({ok:true,cleared:ids.length})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message||'No se pudieron limpiar las pruebas.'},{status:500})}
}
