import {NextResponse} from 'next/server'
import {isAdmin} from '@/lib/adminAuth'
import {adminSupabase} from '@/lib/supabase'

const BUCKET='raffle-images'
const allowed=new Set(['image/jpeg','image/png','image/webp'])

export async function POST(req:Request){
  if(!await isAdmin())return NextResponse.json({ok:false},{status:401})
  try{
    const form=await req.formData()
    const files=form.getAll('files').filter((x):x is File=>x instanceof File)
    if(!files.length)return NextResponse.json({ok:false,error:'Selecciona al menos una imagen.'},{status:400})
    if(files.length>10)return NextResponse.json({ok:false,error:'Máximo 10 imágenes por carga.'},{status:400})

    const db=adminSupabase()
    const {data:bucket}=await db.storage.getBucket(BUCKET)
    if(!bucket){
      const {error}=await db.storage.createBucket(BUCKET,{public:true,allowedMimeTypes:[...allowed]})
      if(error&&!String(error.message).toLowerCase().includes('already'))throw error
    }else if(!bucket.public){
      const {error}=await db.storage.updateBucket(BUCKET,{public:true,allowedMimeTypes:[...allowed]})
      if(error)throw error
    }

    const urls:string[]=[]
    for(const file of files){
      if(!allowed.has(file.type))return NextResponse.json({ok:false,error:`Formato no permitido: ${file.name}`},{status:400})
      if(file.size>10*1024*1024)return NextResponse.json({ok:false,error:`${file.name} supera 10 MB.`},{status:400})
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')
      const safe=file.name.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'imagen'
      const path=`rifas/${Date.now()}-${crypto.randomUUID()}-${safe}.${ext}`
      const bytes=Buffer.from(await file.arrayBuffer())
      const {error}=await db.storage.from(BUCKET).upload(path,bytes,{contentType:file.type,upsert:false})
      if(error)throw error
      const {data}=db.storage.from(BUCKET).getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return NextResponse.json({ok:true,urls})
  }catch(e:any){return NextResponse.json({ok:false,error:e.message||'No se pudieron subir las imágenes.'},{status:500})}
}
