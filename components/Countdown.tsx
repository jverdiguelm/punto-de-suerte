'use client'
import {useEffect,useState} from 'react'
export default function Countdown({target}:{target?:string|null}){
 const end=target?new Date(target).getTime():0; const [t,setT]=useState(Math.max(0,end-Date.now()))
 useEffect(()=>{setT(Math.max(0,end-Date.now())); const i=setInterval(()=>setT(Math.max(0,end-Date.now())),1000);return()=>clearInterval(i)},[end])
 const d=Math.floor(t/86400000),h=Math.floor(t%86400000/3600000),m=Math.floor(t%3600000/60000),s=Math.floor(t%60000/1000)
 return <div className="countdown">{d}d {h}h {m}m {s}s</div>
}
