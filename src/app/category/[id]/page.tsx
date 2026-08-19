"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {categoryById} from "@/lib/categories";
import {readCompareIds,writeCompareIds,MAX_COMPARE} from "@/lib/compare";

type Agent={id:number;agent_id:string;name:string|null;description:string|null;active_claimed:boolean|null;health_status:string|null;capabilities?:string[]|null;matchReasons?:string[]|null};
const PAGE_SIZE=24;
const label=(s:string|null)=>s==="LIVE"?"LIVE":s==="DEAD"?"OFFLINE":s==="TIMEOUT"?"SLOW":"UNVERIFIED";
const tone=(s:string|null)=>s==="LIVE"?"live":s==="DEAD"?"off":s==="TIMEOUT"?"slow":"unv";
const initials=(n:string|null)=>(n||"Agent").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();

export default function CategoryPage({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState("");
 const [agents,setAgents]=useState<Agent[]>([]),[q,setQ]=useState(""),[status,setStatus]=useState(""),[loading,setLoading]=useState(true);
 const [total,setTotal]=useState(0),[hasMore,setHasMore]=useState(false),[loadingMore,setLoadingMore]=useState(false);
 const [compareIds,setCompareIds]=useState<string[]>([]);
 useEffect(()=>{setCompareIds(readCompareIds())},[]);
 useEffect(()=>{params.then(({id})=>setId(id))},[params]);
 function toggleCompare(cid:string){setCompareIds(prev=>{const next=prev.includes(cid)?prev.filter(x=>x!==cid):prev.length<MAX_COMPARE?[...prev,cid]:prev;writeCompareIds(next);return next})}
 const cat=id?categoryById(id):undefined;
 function buildParams(offset:number){const p=new URLSearchParams({limit:String(PAGE_SIZE),offset:String(offset),category:id});if(q)p.set("q",q);if(status)p.set("status",status);return p}
 useEffect(()=>{if(!id)return;const t=setTimeout(async()=>{setLoading(true);const r=await fetch(`/api/agents?${buildParams(0)}`);const d=await r.json();setAgents(d.agents||[]);setTotal(d.total??0);setHasMore(!!d.hasMore);setLoading(false)},200);return()=>clearTimeout(t)},[id,q,status]);
 async function loadMore(){setLoadingMore(true);const r=await fetch(`/api/agents?${buildParams(agents.length)}`);const d=await r.json();setAgents(prev=>[...prev,...(d.agents||[])]);setHasMore(!!d.hasMore);setLoadingMore(false)}
 return <div className="shell">
  <nav className="nav"><div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" className="brand"><span className="brand-mark">A</span>AgentLens</Link><div style={{display:"flex",alignItems:"center",gap:22}}><Link href="/" className="nav-link">Explore</Link><Link href="/discover" className="nav-link">Discover</Link><span className="nav-note">Category · BNB Smart Chain</span></div></div></nav>
  <main className="container">
   {id&&!cat?<div className="empty" style={{marginTop:60}}><strong>Unknown category.</strong><span>Pick one of the four core categories from the home page.</span><Link href="/" className="card-link">← Back home</Link></div>:<>
   <section className="hero cat-hero"><Link href="/" className="crumb">← All categories</Link><div className="eyebrow" style={{marginTop:16}}><span className="cat-hero-ic" aria-hidden>{cat?cat.icon:"○"}</span>{cat?cat.label:"Category"}</div><h1>{cat?cat.label:"Loading…"}</h1><p>{cat?cat.blurb:""}</p><div className="search-wrap"><span className="search-icon">⌕</span><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search within ${cat?cat.label:"this category"}…`}/></div><div className="filter-bar" style={{marginTop:18}}><div className="filter-group"><span>Availability</span>{([["","All"],["LIVE","Live now"],["TIMEOUT","Slow"],["DEAD","Offline"]] as [string,string][]).map(([v,l])=><button key={v||"all"} className={`filter-chip ${status===v?"active":""}`} onClick={()=>setStatus(v)}>{l}</button>)}</div></div></section>
   <section><div className="section-head"><div><h2>Agents in {cat?cat.label:"this category"}</h2><span>Classified from each agent&#39;s own ERC-8004 registration — nothing invented.</span></div><span>{loading?"Searching…":`${total} found`}</span></div>
   {loading?<div className="grid">{[1,2,3,4,5,6].map(i=><div key={i} className="card" style={{opacity:.4}}/>)}</div>:agents.length===0?<div className="empty"><strong>No agents in this category yet.</strong><span>They appear here as soon as matching agents are indexed and verified.</span><Link href="/discover" className="card-link">Browse all agents →</Link></div>:<>
   <div className="grid">{agents.map(a=>{const cid=a.agent_id.split(":").pop()!;const caps=a.capabilities||[];const selected=compareIds.includes(cid);return <Link key={a.id} href={`/agents/${cid}`} className="card"><div className="card-top"><div className="avatar">{initials(a.name)}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><button type="button" title="Add to compare" className={`compare-toggle ${selected?"active":""}`} onClick={e=>{e.preventDefault();e.stopPropagation();toggleCompare(cid)}}>{selected?"✓":"+"}</button><span className={`badge badge-${tone(a.health_status)}`}><span className="bdot"/>{label(a.health_status)}</span></div></div><div className="card-title" style={{marginTop:16}}><h3>{a.name||"Unnamed agent"}</h3><div className="agent-id">ERC-8004 · Agent #{cid}</div></div>{caps.length>0&&<div className="tag-list">{caps.slice(0,3).map(c=><span key={c} className="tag">{c}</span>)}{caps.length>3&&<span className="tag tag-more">+{caps.length-3}</span>}</div>}{a.matchReasons&&a.matchReasons.length>0&&<div className="why"><span className="why-label">Why</span>{a.matchReasons.slice(0,2).map((r,i)=><span key={i} className="why-item">{r}</span>)}</div>}<p className="card-description">{a.description||"No description provided in the registration."}</p><div className="card-footer"><span>{a.active_claimed?"Active claimed":"Registration found"}</span><span className="card-link">Inspect evidence →</span></div></Link>})}</div>
   {hasMore&&<div style={{display:"flex",justifyContent:"center",paddingBottom:80}}><button className="clear-filter" onClick={loadMore} disabled={loadingMore}>{loadingMore?"Loading…":`Load more (${total-agents.length} remaining)`}</button></div>}
   </>}</section></>}
  </main>
  <footer className="footer"><div className="container footer-inner"><span><strong>AgentLens</strong> — the evidence layer for BNB AI agents.</span><span>Built for the Smart Money Era</span></div></footer>
  {compareIds.length>=2&&<div className="compare-bar"><span>{compareIds.length} agent{compareIds.length>1?"s":""} selected</span><div style={{display:"flex",gap:10}}><button className="clear-filter" onClick={()=>{setCompareIds([]);writeCompareIds([])}}>Clear</button><Link href="/compare" className="action" style={{width:"auto",padding:"0 20px",display:"inline-flex",alignItems:"center",textDecoration:"none",marginTop:0}}>Compare →</Link></div></div>}
 </div>;
}
