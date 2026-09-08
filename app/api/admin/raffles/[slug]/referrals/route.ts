import {NextResponse} from 'next/server'
import {isAdmin} from '@/lib/adminAuth'
import {adminSupabase} from '@/lib/supabase'

const clean=(s:any)=>String(s||'').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,50)

async function getRaffle(db:any,slug:string){const {data,error}=await db.from('raffles').select('id,slug').eq('slug',slug).single();if(error)throw error;return data}

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,db=adminSupabase(),r=await getRaffle(db,slug)
    const {data:refs,error}=await db.from('raffle_referrals').select('*').eq('raffle_id',r.id).order('created_at',{ascending:true});if(error)throw error
    const {data:nums,error:ne}=await db.from('raffle_numbers').select('status,participants(referral,is_test)').eq('raffle_id',r.id).in('status',['reserved','paid']);if(ne)throw ne
    const rows=(refs||[]).map((x:any)=>{
      let reserved=0,paid=0
      ;(nums||[]).forEach((n:any)=>{const p=Array.isArray(n.participants)?n.participants[0]:n.participants;if(!p?.is_test&&String(p?.referral||'')===x.code){if(n.status==='paid')paid++;else if(n.status==='reserved')reserved++}})
      return {...x,reserved,paid}
    })
    return NextResponse.json({ok:true,referrals:rows})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}

export async function POST(req:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,b=await req.json(),db=adminSupabase(),r=await getRaffle(db,slug)
    const name=String(b.name||'').trim(),code=clean(b.code||name)
    if(!name||!code)return NextResponse.json({ok:false,error:'Escribe nombre y código.'},{status:400})
    const {data,error}=await db.from('raffle_referrals').insert({raffle_id:r.id,name,code,active:true}).select().single();if(error)throw error
    return NextResponse.json({ok:true,referral:data})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}

export async function PATCH(req:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,b=await req.json(),db=adminSupabase(),r=await getRaffle(db,slug)
    if(!b.id)return NextResponse.json({ok:false,error:'Falta id.'},{status:400})
    const payload:any={}
    if('active' in b)payload.active=!!b.active
    if('name' in b)payload.name=String(b.name||'').trim()
    if('code' in b)payload.code=clean(b.code)
    const {data,error}=await db.from('raffle_referrals').update(payload).eq('id',b.id).eq('raffle_id',r.id).select().single();if(error)throw error
    return NextResponse.json({ok:true,referral:data})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}

export async function DELETE(req:Request,{params}:{params:Promise<{slug:string}>}){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const {slug}=await params,{id}=await req.json(),db=adminSupabase(),r=await getRaffle(db,slug)
    const {error}=await db.from('raffle_referrals').delete().eq('id',id).eq('raffle_id',r.id);if(error)throw error
    return NextResponse.json({ok:true})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}
}
