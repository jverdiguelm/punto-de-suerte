import {NextResponse} from 'next/server'
import {isAdminConfigured,setAdminCookie,validPassword} from '@/lib/adminAuth'
export async function POST(req:Request){
  if(!isAdminConfigured())return NextResponse.json({ok:false,error:'La administración no está configurada correctamente.'},{status:503})
  const {password}=await req.json()
  if(!validPassword(String(password||''))) return NextResponse.json({ok:false,error:'Clave incorrecta'},{status:401})
  await setAdminCookie()
  return NextResponse.json({ok:true})
}
