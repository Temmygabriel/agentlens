"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

type Agent={id:number;agent_id:string;name:string|null;description:string|null;active_claimed:boolean|null;health_status:string|null;capabilities?:string[]|null};
const status=(s:string|null)=>s==="LIVE"?"LIVE":s==="DEAD"?"DEAD":s==="TIMEOUT"?"SLOW":"UNVERIFIED";
const initials=(n:string|null)=>(n||"Agent").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();

export default function Home(){
 const [agents,setAgents]=useState<Agent[]>([]),[q,setQ]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{const t=setTimeout(async()=>{setLoading(true);const r=await fetch(`/api/agents?q=${encodeURIComponent(q)}&limit=50`);const d=await r.json();setAgents(d.agents||[]);setLoading(false)},250);return()=>clearTimeout(t)},[q]);
 return <div className="shell">
  <nav className="nav"><div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" className="brand"><span className="brand-mark">A</span>AgentLens</Link><span className="nav-note">BNB Smart Chain · ERC-8004</span></div></nav>
  <main className="container">
   <section className="hero"><div className="eyebrow"><span className="eyebrow-dot"/>Verified agent discovery</div><h1>Find an agent you can actually use.</h1><p>Discover AI agents on BNB Smart Chain, compare what they do, and inspect evidence before you put them to work.</p><div className="search-wrap"><span className="search-icon">⌕</span><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by agent name, capability, or description…"/></div><div className="stats"><div className="stat"><strong>{loading?"—":agents.length}</strong> agents found</div><div className="stat"><strong>BNB</strong> Smart Chain</div><div className="stat"><strong>ERC-8004</strong> identity</div></div></section>
   <section><div className="section-head"><div><h2>Explore agents</h2><span>Start with evidence, not promises.</span></div><span>{loading?"Loading…":`${agents.length} found`}</span></div>
    {loading?<div className="grid">{[1,2,3,4,5,6].map(i=><div key={i} className="card" style={{opacity:.4}}/>)}</div>:agents.length===0?<div className="empty">No matching agents yet. Try a broader search.</div>:<div className="grid">{agents.map(a=>{const id=a.agent_id.split(":").pop();const live=a.health_status==="LIVE";const caps=a.capabilities||[];return <Link key={a.id} href={`/agents/${id}`} className="card"><div className="card-top"><div className="avatar">{initials(a.name)}</div><span className={`badge ${live?"badge-live":"badge-neutral"}`}>{status(a.health_status)}</span></div><div className="card-title" style={{marginTop:16}}><h3>{a.name||"Unnamed agent"}</h3><div className="agent-id">ERC-8004 · Agent #{id}</div></div>{caps.length>0&&<div className="tag-list">{caps.slice(0,3).map(c=><span key={c} className="tag">{c}</span>)}{caps.length>3&&<span className="tag tag-more">+{caps.length-3}</span>}</div>}<p className="card-description">{a.description||"No description provided in the registration."}</p><div className="card-footer"><span>{a.active_claimed?"Active claimed":"Registration found"}</span><span className="card-link">View evidence →</span></div></Link>})}</div>}
   </section>
  </main>
  <footer className="footer"><div className="container footer-inner"><span><strong>AgentLens</strong> — the evidence layer for BNB AI agents.</span><span>Built for the Smart Money Era</span></div></footer>
 </div>;
}