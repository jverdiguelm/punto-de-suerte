import './globals.css'
import type {Metadata} from 'next'
const site=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'
export const metadata:Metadata={metadataBase:new URL(site),title:{default:'Punto de Suerte',template:'%s | Punto de Suerte'},description:'Elige tu número. Puede ser el tuyo.',openGraph:{siteName:'Punto de Suerte',type:'website',locale:'es_MX'},robots:{index:true,follow:true},icons:{icon:'/favicon.svg'}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}<footer className="siteFooter"><b>Punto de Suerte</b><span> · Elige tu número. Puede ser el tuyo.</span></footer></body></html>}
