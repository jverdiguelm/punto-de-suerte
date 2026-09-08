import {NextResponse} from 'next/server'
import {adminSupabase} from '@/lib/supabase'

export async function POST(req:Request){
 try{
  const body=await req.json(); const slug=String(body.slug||'').trim(); const number=Number(body.number); const name=String(body.name||'').trim(); const whatsapp=String(body.whatsapp||'').trim(); const referral=String(body.referral||'directo').slice(0,80)
  if(!slug||!Number.isInteger(number)||number<1||!name||whatsapp.replace(/\D/g,'').length<8) return NextResponse.json({ok:false,error:'Revisa nombre, WhatsApp y número.'},{status:400})
  const db=adminSupabase(); const {data,error}=await db.rpc('reserve_raffle_number',{p_slug:slug,p_number:number,p_name:name,p_whatsapp:whatsapp,p_referral:referral}); if(error) throw error
  const result=data as any; if(!result?.ok)return NextResponse.json(result,{status:409})
  const {data:raffle}=await db.from('raffles').select('title,whatsapp').eq('slug',slug).single(); const wa=(raffle?.whatsapp||process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||'').replace(/\D/g,'')
  const msg=encodeURIComponent(`Hola 👋 Aparté el número ${String(number).padStart(2,'0')} para ${raffle?.title||'la rifa'}. Mi nombre es ${name}. Quiero información para realizar mi pago.`)
  return NextResponse.json({...result,whatsappUrl:`https://wa.me/${wa}?text=${msg}`})
 }catch(e:any){return NextResponse.json({ok:false,error:e.message||'No se pudo apartar.'},{status:500})}
}
