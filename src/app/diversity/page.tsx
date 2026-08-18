"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

type Breakdown={label:string;count:number};
type Stats={total:number;live:number;offline:number;slow:number;capabilityTypes:number;protocolTypes:number;domainTypes:number;withCapabilities:number;capabilityBreakdown?:Breakdown[];protocolBreakdown?:Breakdown[];domainBreakdown?:Breakdown[]};

function Column({title,note,items}:{title:string;note:string;items?:Breakdown[]}){
 const max=items&&items.length?items[0].count:0;
 return <div className="diversity-col">
  <h3>{title}</h3>
  <p>{note}</p>
  {items&&items.length?items.map(item=><div className="diversity-row" key={item.label}>
   <div className="diversity-row-head"><strong>{item.label}</strong><span>{item.count} agent{item.count===1?"":"s"}</span></div>
   <div className="diversity-bar-track"><div className="diversity-bar-fill" style={{width:`${max?Math.max((item.count/max)*100,4):0}%`}}/></div>
  </div>):<div className="diversity-empty">No declared values yet — this evidence appears once agents' registrations include it.</div>}
 </div>;
}

export default function Diversity(){
 const [stats,setStats]=useState<Stats|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{fetch("/api/stats").then(r=>r.json()).then(d=>{if(d&&typeof d.total==="number")setStats(d);else setError(d?.error||"Failed to load diversity data")}).catch(()=>setError("Failed to load diversity data"))},[]);

 return <div className="shell">
  <nav className="nav"><div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" className="brand"><span className="brand-mark">A</span>AgentLens</Link><div style={{display:"flex",alignItems:"center",gap:22}}><Link href="/" className="nav-link">Explore</Link><Link href="/discover" className="nav-link">Discover</Link><Link href="/diversity" className="nav-link nav-link-active">Diversity</Link><span className="nav-note">BNB Smart Chain · ERC-8004</span></div></div></nav>
  <main className="container">
   <section className="hero" style={{paddingBottom:8}}>
    <div className="eyebrow"><span className="eyebrow-dot"/>Marketplace evidence</div>
    <h1 style={{fontSize:"clamp(36px,5vw,54px)"}}>How diverse is this marketplace, really?</h1>
    <p>Every value below comes straight from agents&#39; own ERC-8004 registrations — nothing inferred, nothing invented. An agent with no declared capability, domain, or protocol simply isn&#39;t counted, rather than being guessed at.</p>
    {error?<div className="empty" style={{marginTop:24}}>{error}</div>:!stats?<div className="stats"><div className="stat">Loading…</div></div>:
    <div className="diversity-summary">
     <div className="stat"><strong>{stats.total}</strong> agents indexed</div>
     <div className="stat"><strong>{stats.withCapabilities}</strong> declare at least one capability</div>
     <div className="stat"><strong>{stats.capabilityTypes}</strong> distinct capabilities</div>
     <div className="stat"><strong>{stats.domainTypes}</strong> distinct domains</div>
     <div className="stat"><strong>{stats.protocolTypes}</strong> distinct protocols</div>
    </div>}
   </section>
   {stats&&<section style={{paddingTop:28}}>
    <div className="diversity-grid">
     <Column title="Capabilities" note="Declared skills — what agents say they can do." items={stats.capabilityBreakdown}/>
     <Column title="Domains" note="Declared subject areas the agent operates in." items={stats.domainBreakdown}/>
     <Column title="Protocols" note="Declared service protocols agents expose (web, MCP, A2A, x402…)." items={stats.protocolBreakdown}/>
    </div>
   </section>}
  </main>
  <footer className="footer"><div className="container footer-inner"><span><strong>AgentLens</strong> — the evidence layer for BNB AI agents.</span><span>Built for the Smart Money Era</span></div></footer>
 </div>;
}
