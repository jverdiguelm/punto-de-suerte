import {createHmac,timingSafeEqual} from 'crypto'
import {cookies} from 'next/headers'

const COOKIE='rifas_admin'
function token(){
  const secret=process.env.ADMIN_SESSION_SECRET
  if(!secret) return null
  return createHmac('sha256',secret).update('rifas-admin-session-v0.2').digest('hex')
}
export function isAdminConfigured(){return Boolean(process.env.ADMIN_PASSWORD&&process.env.ADMIN_SESSION_SECRET)}
export function validPassword(input:string){
  const expected=process.env.ADMIN_PASSWORD||''
  if(!isAdminConfigured()||!input) return false
  const a=Buffer.from(input); const b=Buffer.from(expected)
  return a.length===b.length && timingSafeEqual(a,b)
}
export async function isAdmin(){
  const c=await cookies(); const got=c.get(COOKIE)?.value||''; const exp=token()
  if(!got||!exp||got.length!==exp.length) return false
  return timingSafeEqual(Buffer.from(got),Buffer.from(exp))
}
export async function setAdminCookie(){
  const value=token()
  if(!value) throw new Error('Falta ADMIN_SESSION_SECRET.')
  const c=await cookies(); c.set(COOKIE,value,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*12})
}
export async function clearAdminCookie(){const c=await cookies(); c.delete(COOKIE)}
