import RaffleBoard from '@/components/RaffleBoard'
import Countdown from '@/components/Countdown'
import {adminSupabase} from '@/lib/supabase'
import {notFound} from 'next/navigation'
import {isAdmin} from '@/lib/adminAuth'
import {redirect} from 'next/navigation'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{slug:string}>}){
 if(!await isAdmin())redirect('/admin')
 const {slug}=await params,db=adminSupabase();const {data:r}=await db.from('raffles').select('*').eq('slug',slug).single();if(!r||r.status!=='draft')notFound();const imgs=Array.isArray(r.gallery_images)?r.gallery_images:[]
 return <main className="wrap"><div className="testTopbar"><div><b>🧪 MODO PRUEBA</b><span>La rifa sigue en BORRADOR. Nada de aquí cuenta como venta real.</span></div><a className="btn secondary" href={`/admin/rifas/${slug}`}>← Volver al panel</a></div><section className="hero"><div><span className="badge">SOLO {r.total_numbers} NÚMEROS</span><h1>{r.title}</h1><p className="muted">{r.description}</p><div className="price">${(r.price_cents/100).toLocaleString('es-MX')} <small>por número</small></div>{r.closes_at&&<Countdown target={r.closes_at}/>}</div>{r.hero_image&&<img src={r.hero_image} alt={r.title}/>}</section><section className="card testCard"><h2>Prueba el flujo completo 🧪</h2><p className="muted">Selecciona un número, simula un apartado y después vuelve al panel para confirmar pago o liberarlo.</p><RaffleBoard slug={slug} testMode/></section>{imgs.length>0&&<section className="card"><h2>El premio</h2><div className="gallery">{imgs.map((x:string,i:number)=><img key={i} src={x} alt={`${r.title} ${i+1}`}/>)}</div></section>}<section className="card"><h2>¿Cómo funciona?</h2><p>1. Elige un número. 2. Escribe datos de prueba. 3. Simula el apartado. 4. Regresa al panel. 5. Confirma el pago o libera el número. 6. Limpia todas las pruebas antes de activar.</p></section>{r.delivery_text&&<section className="card"><h2>Entrega del premio</h2><p className="preLine">{r.delivery_text}</p></section>}{r.terms_text&&<section className="card"><h2>Bases y condiciones</h2><p className="preLine termsText">{r.terms_text}</p></section>}</main>
}
