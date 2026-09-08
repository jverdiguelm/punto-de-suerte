import {NextResponse} from 'next/server'
import {isAdmin} from '@/lib/adminAuth'
import {raffleValidationError} from '@/lib/raffleValidation'
import {adminSupabase} from '@/lib/supabase'

async function raffle(db:any,slug:string){const {data,error}=await db.from('raffles').select('*').eq('slug',slug).single();if(error)throw error;return data}
const cleanSlug=(s:any)=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,db=adminSupabase(),r=await raffle(db,slug)
    const {error:releaseError}=await db.from('raffle_numbers').update({status:'available',reserved_until:null,participant_id:null}).eq('raffle_id',r.id).eq('status','reserved').lt('reserved_until',new Date().toISOString())
    if(releaseError)throw releaseError
    const {data:numbers,error}=await db.from('raffle_numbers').select('id,number,status,reserved_until,participant_id,participants(id,name,whatsapp,referral,created_at,is_test)').eq('raffle_id',r.id).order('number')
    if(error)throw error
    return NextResponse.json({ok:true,raffle:r,numbers})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}

export async function POST(req:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,{number,action}=await req.json(),db=adminSupabase(),r=await raffle(db,slug)
    const {data:row,error:re}=await db.from('raffle_numbers').select('participant_id,status,participants(is_test)').eq('raffle_id',r.id).eq('number',number).single();if(re)throw re
    if(action==='paid'){
      if(!row.participant_id)return NextResponse.json({ok:false,error:'Sin participante'},{status:400})
      const {error:updateError}=await db.from('raffle_numbers').update({status:'paid',reserved_until:null}).eq('raffle_id',r.id).eq('number',number)
      if(updateError)throw updateError
      const {data:ex,error:paymentLookupError}=await db.from('payments').select('id').eq('raffle_id',r.id).eq('participant_id',row.participant_id).eq('status','confirmed').maybeSingle()
      if(paymentLookupError)throw paymentLookupError
      if(!ex){const p:any=Array.isArray((row as any).participants)?(row as any).participants[0]:(row as any).participants;const {error}=await db.from('payments').insert({raffle_id:r.id,participant_id:row.participant_id,amount_cents:r.price_cents,status:'confirmed',confirmed_at:new Date().toISOString(),is_test:!!p?.is_test});if(error)throw error}
    }else if(action==='release'){
      if(row.participant_id){const {error}=await db.from('payments').delete().eq('raffle_id',r.id).eq('participant_id',row.participant_id);if(error)throw error}
      const {error}=await db.from('raffle_numbers').update({status:'available',reserved_until:null,participant_id:null}).eq('raffle_id',r.id).eq('number',number)
      if(error)throw error
    }else return NextResponse.json({ok:false,error:'Acción inválida'},{status:400})
    return NextResponse.json({ok:true})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}

export async function PATCH(req:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,b=await req.json(),db=adminSupabase(),r=await raffle(db,slug)

    // Cambios de estado son independientes de la edición de un borrador.
    if(('status' in b)&&Object.keys(b).every(key=>key==='status'||key==='startNow')){
      const next=String(b.status)
      if(next==='open'&&r.status==='draft'){const {count}=await db.from('participants').select('*',{count:'exact',head:true}).eq('raffle_id',r.id).eq('is_test',true);if((count||0)>0)return NextResponse.json({ok:false,error:'Limpia los datos del modo prueba antes de activar la rifa.'},{status:400})}
      if(!['draft','open','closed'].includes(next))return NextResponse.json({ok:false,error:'Estado inválido.'},{status:400})
      if(r.status==='open'&&next==='draft')return NextResponse.json({ok:false,error:'Una rifa activa no puede volver a borrador.'},{status:400})
      if(r.status==='closed'&&next==='draft')return NextResponse.json({ok:false,error:'Una rifa cerrada no puede volver a borrador.'},{status:400})
      const startNow=next==='open'&&b.startNow===true
      const {data,error}=await db.from('raffles').update({status:next,opens_at:startNow?null:r.opens_at,updated_at:new Date().toISOString()}).eq('id',r.id).select().single();if(error)throw error
      return NextResponse.json({ok:true,raffle:data})
    }

    if(Object.keys(b).length===1&&b.resetToDraft===true){
      if(r.status!=='closed')return NextResponse.json({ok:false,error:'Solo puedes restablecer una rifa cerrada.'},{status:400})
      const {data,error}=await db.rpc('reset_raffle_to_draft',{p_slug:slug})
      if(error)throw error
      if(!data?.ok)return NextResponse.json(data,{status:400})
      const updated=await raffle(db,slug)
      return NextResponse.json({ok:true,raffle:updated})
    }

    if(r.status==='closed'&&Object.keys(b).every(key=>key==='opens_at'||key==='closes_at')){
      const opensAt=b.opens_at||null,closesAt=b.closes_at||null,validationError=raffleValidationError(r.reserve_minutes,opensAt,closesAt)
      if(validationError)return NextResponse.json({ok:false,error:validationError},{status:400})
      const {data,error}=await db.from('raffles').update({opens_at:opensAt,closes_at:closesAt,updated_at:new Date().toISOString()}).eq('id',r.id).select().single()
      if(error)throw error
      return NextResponse.json({ok:true,raffle:data})
    }

    if(r.status!=='draft')return NextResponse.json({ok:false,error:'Solo puedes editar una rifa mientras está en borrador.'},{status:400})

    const newSlug='slug' in b?cleanSlug(b.slug):r.slug
    const total='total_numbers' in b?Number(b.total_numbers):r.total_numbers
    const price='price' in b?Math.round(Number(b.price)*100):r.price_cents
    const value='value' in b?Math.round(Number(b.value||0)*100):r.value_cents
    const target='target' in b?Math.round(Number(b.target||0)*100):r.target_cents
    const reserve='reserve_minutes' in b?Number(b.reserve_minutes):r.reserve_minutes
    const opensAt=b.opens_at||null,closesAt=b.closes_at||null,validationError=raffleValidationError(reserve,opensAt,closesAt)
    if(!newSlug||!String(b.title??r.title).trim()||!Number.isInteger(total)||total<1||total>10000||price<1)return NextResponse.json({ok:false,error:'Revisa título, slug, precio y cantidad.'},{status:400})
    if(validationError)return NextResponse.json({ok:false,error:validationError},{status:400})

    if(total!==r.total_numbers){
      const {count,error:ce}=await db.from('raffle_numbers').select('*',{count:'exact',head:true}).eq('raffle_id',r.id).neq('status','available')
      if(ce)throw ce
      if((count||0)>0)return NextResponse.json({ok:false,error:'No puedes cambiar la cantidad porque ya hay números apartados o pagados.'},{status:400})
      const {error:de}=await db.from('raffle_numbers').delete().eq('raffle_id',r.id);if(de)throw de
      const rows=Array.from({length:total},(_,i)=>({raffle_id:r.id,number:i+1}))
      for(let i=0;i<rows.length;i+=500){const {error:e}=await db.from('raffle_numbers').insert(rows.slice(i,i+500));if(e)throw e}
    }

    const payload:any={
      slug:newSlug,title:String(b.title??r.title).trim(),description:b.description??r.description??'',
      price_cents:price,value_cents:value||null,target_cents:target||null,total_numbers:total,
      reserve_minutes:reserve,whatsapp:b.whatsapp??r.whatsapp??'',opens_at:opensAt,closes_at:closesAt,
      hero_image:b.hero_image||null,gallery_images:Array.isArray(b.gallery_images)?b.gallery_images:r.gallery_images,
      terms_text:b.terms_text??r.terms_text??'',delivery_text:b.delivery_text??r.delivery_text??'',
      updated_at:new Date().toISOString()
    }
    const {data,error}=await db.from('raffles').update(payload).eq('id',r.id).select().single();if(error)throw error
    return NextResponse.json({ok:true,raffle:data})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}

export async function DELETE(_:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,db=adminSupabase(),r=await raffle(db,slug)
    if(r.status!=='draft')return NextResponse.json({ok:false,error:'Solo puedes eliminar rifas en borrador.'},{status:400})
    const {count,error:ce}=await db.from('raffle_numbers').select('*',{count:'exact',head:true}).eq('raffle_id',r.id).neq('status','available')
    if(ce)throw ce
    if((count||0)>0)return NextResponse.json({ok:false,error:'La rifa tiene números apartados o pagados y no puede eliminarse.'},{status:400})
    const {error}=await db.from('raffles').delete().eq('id',r.id);if(error)throw error
    return NextResponse.json({ok:true})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
