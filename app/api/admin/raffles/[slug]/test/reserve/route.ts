import {NextResponse} from 'next/server'
import {isAdmin} from '@/lib/adminAuth'
import {adminSupabase} from '@/lib/supabase'

export async function POST(req:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false,error:'No autorizado'},{status:401})
  try{
    const {slug}=await params
    const b=await req.json()
    const number=Number(b.number),name=String(b.name||'').trim(),whatsapp=String(b.whatsapp||'').trim(),referral=String(b.referral||'prueba').slice(0,80)
    if(!Number.isInteger(number)||number<1||!name||whatsapp.replace(/\D/g,'').length<8)return NextResponse.json({ok:false,error:'Revisa nombre, WhatsApp y número.'},{status:400})
    const db=adminSupabase()
    const {data:r,error:re}=await db.from('raffles').select('*').eq('slug',slug).single();if(re)throw re
    if(r.status!=='draft')return NextResponse.json({ok:false,error:'El modo prueba solo está disponible en borradores.'},{status:400})
    const {data:num,error:ne}=await db.from('raffle_numbers').select('*').eq('raffle_id',r.id).eq('number',number).single();if(ne)throw ne
    if(num.status!=='available')return NextResponse.json({ok:false,error:'Ese número ya está ocupado en la prueba.'},{status:409})
    const {data:p,error:pe}=await db.from('participants').insert({raffle_id:r.id,name,whatsapp,referral,is_test:true}).select('id').single();if(pe)throw pe
    const until=new Date(Date.now()+Number(r.reserve_minutes||30)*60000).toISOString()
    const {error:ue}=await db.from('raffle_numbers').update({status:'reserved',reserved_until:until,participant_id:p.id}).eq('id',num.id);if(ue)throw ue
    return NextResponse.json({ok:true,number,reservedUntil:until,whatsappUrl:'#',test:true})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message||'No se pudo apartar en modo prueba.'},{status:500})}
}
