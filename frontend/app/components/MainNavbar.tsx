'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
const links = [['Resume studio','/builder'],['Templates','/tools?view=templates'],['Resume checker','/resume-scanner'],['Cover letters','/cover-letter'],['Job tracker','/job-tracker']];
export default function MainNavbar(){
 const [open,setOpen]=useState(false); const pathname=usePathname();
 useEffect(()=>{setOpen(false)},[pathname]);
 useEffect(()=>{const escape=(e:KeyboardEvent)=>e.key==='Escape'&&setOpen(false);window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[]);
 return <nav aria-label="Main navigation" className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#061B2D] text-white">
 <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
 <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={()=>setOpen(false)}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2BC4A8] text-sm font-bold text-[#061B2D]">CF</span><span className="leading-tight"><span className="block font-semibold tracking-tight">CareerForge</span><span className="block text-[10px] uppercase tracking-[.2em] text-teal-200">by DoCHEng</span></span></Link>
 <div className="hidden items-center gap-1 xl:flex">{links.map(([label,href])=><Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white" aria-current={pathname===href?'page':undefined}>{label}</Link>)}</div>
 <div className="flex items-center gap-3"><Link href="/dashboard" className="hidden items-center gap-2 rounded-xl bg-[#2BC4A8] px-4 py-2 text-sm font-semibold text-[#061B2D] hover:bg-teal-200 sm:inline-flex">My workspace <ArrowUpRight size={16}/></Link><button aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)} className="rounded-lg p-2 hover:bg-white/10 xl:hidden">{open?<X/>:<Menu/>}</button></div></div>
 {open&&<div id="mobile-navigation" className="border-t border-white/10 p-4 xl:hidden">{[...links,['My workspace','/dashboard'],['CV writing guide','/resources/guides']].map(([label,href])=><Link className="block rounded-lg p-3 hover:bg-white/10" href={href} key={href} onClick={()=>setOpen(false)}>{label}</Link>)}</div>}</nav>;
}