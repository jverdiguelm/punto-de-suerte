'use client'
export default function ShareButtons({title,price}:{title:string;price:number}){
 function url(){return window.location.href}
 async function copy(){await navigator.clipboard.writeText(url());alert('Enlace copiado')}
 function wa(){const text=encodeURIComponent(`Mira esta rifa de Punto de Suerte: ${title} · $${price.toLocaleString('es-MX')} por número\n${url()}`);window.open(`https://wa.me/?text=${text}`,'_blank','noopener,noreferrer')}
 return <div className="shareRow"><button className="btn" onClick={wa}>Compartir por WhatsApp</button><button className="btn secondary" onClick={copy}>Copiar enlace</button></div>
}
