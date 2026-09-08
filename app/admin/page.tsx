'use client'
import {useCallback,useEffect,useState} from 'react'
function money(c:number){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(c/100)}
export default function Admin(){
  const [password,setPassword]=useState(''),[authed,setAuthed]=useState<boolean|null>(null),[raffles,setRaffles]=useState<any[]>([]),[error,setError]=useState('')
  const load=useCallback(async()=>{const r=await fetch('/api/admin/raffles',{cache:'no-store'});if(r.status===401){setAuthed(false);return}const j=await r.json();if(j.ok){setAuthed(true);setRaffles(j.raffles||[])}else setError(j.error)},[])
  useEffect(()=>{load()},[load])
  async function login(){const r=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});if(!r.ok){setError('Clave incorrecta');return}setPassword('');load()}
  async function logout(){await fetch('/api/admin/logout',{method:'POST'});setAuthed(false)}
  async function remove(slug:string,title:string){if(!confirm(`¿Eliminar definitivamente el borrador “${title}”?`))return;const r=await fetch(`/api/admin/raffles/${slug}`,{method:'DELETE'});const j=await r.json();if(!r.ok){alert(j.error||'No se pudo eliminar');return}load()}
  if(authed===null)return <main className="wrap"><div className="card">Cargando...</div></main>
  if(!authed)return <main className="wrap"><div className="card adminLogin"><span className="badge">ADMIN</span><h1>Panel privado</h1><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/><button className="btn" onClick={login}>Entrar</button>{error&&<p className="notice error">{error}</p>}</div></main>
  return <main className="wrap"><div className="adminHeader"><div><span className="badge">ADMIN</span><h1>Mis rifas</h1><p className="muted">Crea y administra todas tus rifas desde aquí.</p></div><div><a className="btn" href="/admin/rifas/nueva">+ Nueva rifa</a> <button className="btn secondary" onClick={logout}>Salir</button></div></div><div className="refGrid">{raffles.map(r=><div className="card" key={r.id}><span className="badge">{r.status}</span><h2>{r.title}</h2><p className="muted">{r.total_numbers} números · {money(r.price_cents)} c/u</p><p><b>{r.paid}</b> pagados · <b>{r.reserved}</b> apartados</p><p><b>{money(r.paid*r.price_cents)}</b> recaudado</p><a className="btn" href={`/admin/rifas/${r.slug}`}>{r.status==='draft'?'Editar borrador':'Administrar'}</a> {r.status!=='draft'&&<a className="btn secondary" href={`/rifa/${r.slug}`} target="_blank">Ver pública</a>} {r.status==='draft'&&<button className="btn danger" onClick={()=>remove(r.slug,r.title)}>Eliminar</button>}</div>)}</div></main>
}
