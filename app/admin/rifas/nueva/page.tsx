'use client'

import {useMemo,useState} from 'react'
import {useRouter} from 'next/navigation'
import RafflePreview from '@/components/RafflePreview'

const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(n||0)
const roundUp10=(n:number)=>Math.ceil(n/10)*10

export default function Nueva(){
  const router=useRouter()
  const [f,setF]=useState<any>({title:'',slug:'',description:'',price:200,value:15000,target:10000,total_numbers:50,reserve_minutes:30,whatsapp:'',opens_at:'',closes_at:'',hero_image:'',gallery_images:[],terms_text:'',delivery_text:''})
  const [autoPrice,setAutoPrice]=useState(true)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [uploading,setUploading]=useState(false)

  const exact=useMemo(()=>f.total_numbers>0?Number(f.target||0)/Number(f.total_numbers):0,[f.target,f.total_numbers])
  const recommended=useMemo(()=>roundUp10(exact),[exact])
  const projected=useMemo(()=>Number(f.price||0)*Number(f.total_numbers||0),[f.price,f.total_numbers])

  function set(k:string,v:any){
    const next={...f,[k]:v}
    if(autoPrice&&(k==='target'||k==='total_numbers')){
      const target=Number(k==='target'?v:next.target)||0
      const total=Number(k==='total_numbers'?v:next.total_numbers)||0
      if(total>0) next.price=roundUp10(target/total)
    }
    setF(next)
  }
  function toggleAuto(v:boolean){setAutoPrice(v);if(v&&Number(f.total_numbers)>0)setF({...f,price:roundUp10(Number(f.target||0)/Number(f.total_numbers))})}
  async function upload(files:FileList|null,kind:'hero'|'gallery'){
    if(!files?.length)return
    setUploading(true);setError('')
    try{
      const fd=new FormData();Array.from(files).forEach(file=>fd.append('files',file))
      const r=await fetch('/api/admin/uploads',{method:'POST',body:fd});const j=await r.json()
      if(!r.ok)throw new Error(j.error||'No se pudieron subir las imágenes.')
      const urls:string[]=j.urls||[]
      if(kind==='hero')setF((old:any)=>({...old,hero_image:urls[0]||''}))
      else setF((old:any)=>({...old,gallery_images:[...(old.gallery_images||[]),...urls]}))
    }catch(e:any){setError(e.message)}finally{setUploading(false)}
  }
  async function save(){
    setBusy(true);setError('')
    const r=await fetch('/api/admin/raffles',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...f,status:'draft'})})
    const j=await r.json();setBusy(false)
    if(!r.ok){setError(j.error||'Error');return}
    router.push(`/admin/rifas/${j.raffle.slug}`)
  }

  return <main className="wrap">
    <div className="adminHeader"><div><span className="badge">NUEVA RIFA</span><h1>Crear rifa</h1><p className="muted">Edita a la izquierda y observa en vivo cómo se verá en celular.</p></div><a className="btn secondary" href="/admin">← Mis rifas</a></div>
    <div className="editorPreviewLayout">
      <section className="card editorPane">
        <label>Título</label><input value={f.title} onChange={e=>set('title',e.target.value)}/>
        <label>Slug (URL)</label><input value={f.slug} onChange={e=>set('slug',e.target.value)} placeholder="iphone-17"/>
        <label>Descripción</label><textarea value={f.description} onChange={e=>set('description',e.target.value)}/>
        <div className="formGrid">
          <div><label>Meta que quieres obtener (MXN)</label><input type="number" value={f.target} onChange={e=>set('target',Number(e.target.value))}/></div>
          <div><label>Cantidad de boletos</label><input type="number" min="1" value={f.total_numbers} onChange={e=>set('total_numbers',Number(e.target.value))}/></div>
          <div><label>Precio por boleto (MXN)</label><input type="number" value={f.price} disabled={autoPrice} onChange={e=>set('price',Number(e.target.value))}/></div>
          <div><label>Valor del premio (MXN)</label><input type="number" value={f.value} onChange={e=>set('value',Number(e.target.value))}/></div>
          <div><label>Apartado (minutos)</label><input type="number" min="1" max="1440" value={f.reserve_minutes} onChange={e=>set('reserve_minutes',Number(e.target.value))}/></div>
          <div><label>WhatsApp</label><input value={f.whatsapp} onChange={e=>set('whatsapp',e.target.value)} placeholder="521477..."/></div>
        </div>
        <label className="checkRow"><input type="checkbox" checked={autoPrice} onChange={e=>toggleAuto(e.target.checked)}/> Calcular precio automáticamente</label>
        <div className="calcBox"><div><span>Precio exacto para llegar a la meta</span><b>{money(exact)}</b></div><div><span>Precio recomendado</span><b>{money(recommended)}</b></div><div><span>Recaudación si vendes todo</span><b>{money(projected)}</b></div></div>
        <div className="formGrid"><div><label>Apertura pública (opcional)</label><input type="datetime-local" value={f.opens_at} onChange={e=>set('opens_at',e.target.value)}/></div><div><label>Cierre</label><input type="datetime-local" value={f.closes_at} onChange={e=>set('closes_at',e.target.value)}/></div></div>
        <label>Entrega del premio</label><textarea value={f.delivery_text} onChange={e=>set('delivery_text',e.target.value)} placeholder="Ej. Entrega personal en León, Gto. o envío acordado con la persona ganadora."/>
        <label>Bases y condiciones</label><textarea className="termsEditor" value={f.terms_text} onChange={e=>set('terms_text',e.target.value)} placeholder="Escribe aquí las bases completas: confirmación de pago, cierre, mecánica, entrega y cualquier condición aplicable."/>
        <label>Imagen principal</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>upload(e.target.files,'hero')}/>
        {f.hero_image&&<div className="uploadPreview"><img src={f.hero_image} alt="Principal"/><button type="button" className="tinyBtn danger" onClick={()=>set('hero_image','')}>Quitar</button></div>}
        <label>Galería</label><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>upload(e.target.files,'gallery')}/>
        {(f.gallery_images||[]).length>0&&<div className="uploadGrid">{f.gallery_images.map((x:string,i:number)=><div key={x+i}><img src={x} alt={`Galería ${i+1}`}/><button type="button" className="tinyBtn danger" onClick={()=>set('gallery_images',f.gallery_images.filter((_:string,n:number)=>n!==i))}>Quitar</button></div>)}</div>}
        {uploading&&<p className="notice">Subiendo imágenes...</p>}{error&&<p className="notice error">{error}</p>}
        <div className="stickyActions"><button className="btn" disabled={busy||uploading} onClick={save}>{busy?'Guardando...':'Guardar borrador'}</button><span className="muted">Después podrás abrir la vista previa completa antes de activar.</span></div>
      </section>
      <aside className="livePreviewPane"><div className="previewPhoneLabel">VISTA MÓVIL EN VIVO</div><div className="phoneFrame"><RafflePreview raffle={f} compact/></div></aside>
    </div>
  </main>
}
