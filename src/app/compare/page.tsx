"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {readCompareIds,writeCompareIds} from "@/lib/compare";

type Agent={chainId:number;agentId:string;owner:string;agentUri:string;metadata:{name?:string;description?:string;active?:boolean;x402Support?:boolean;services?:{name:string}[]}|null;capabilities?:string[];domains?:string[];protocols?:string[]};
type Health={summary:{overallStatus:string;healthScore:number;liveCount:number;probeCount:number}};
type Row=Agent&{health?:Health;error?:string};

const initials=(n?:string)=>((n||"Agent").split(/\s+/).slice(0,2).map(x=>x[0]).join("")).toUpperCase();
const short=(v:string)=>v.length>18?`${v.slice(0,9)}…${v.slice(-7)}`:v;

export default function Compare(){
 const [ids,setIds]=useState<string[]>([]);
 const [rows,setRows]=useState<Row[]>([]);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{setIds(readCompareIds())},[]);

 useEffect(()=>{
  if(ids.length===0){setRows([]);setLoading(false);return}
  setLoading(true);
  Promise.all(ids.map(async id=>{
   const [a,h]=await Promise.all([fetch(`/api/agents/${id}`),fetch(`/api/agents/${id}/health`)]);
   const agent=await a.json();
   const health=h.ok?await h.json():undefined;
   return {...agent,health} as Row;
  })).then(r=>{setRows(r.filter(x=>!x.error));setLoading(false)});
 },[ids]);

 function remove(id:string){const next=ids.filter(x=>x!==id);setIds(next);writeCompareIds(next)}

 return <div className="shell">
  <nav className="nav"><div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" className="brand"><span className="brand-mark">A</span>AgentLens</Link><div style={{display:"flex",alignItems:"center",gap:22}}><Link href="/" className="nav-link">Explore</Link><Link href="/discover" className="nav-link">Discover</Link><Link href="/diversity" className="nav-link">Diversity</Link><span className="nav-note">Compare agents</span></div></div></nav>
  <main className="container">
   <section className="detail-hero"><Link href="/" className="crumb">← Back to agents</Link></section>
   <section style={{paddingBottom:26}}><h1 style={{margin:0,fontSize:32,letterSpacing:"-.04em"}}>Compare agents</h1><p style={{color:"#667085",margin:"8px 0 0"}}>Side-by-side evidence — pick up to 3 agents from Explore or Discover to compare them here.</p></section>

   {loading?<div className="compare-empty">Loading comparison…</div>:ids.length===0?
    <div className="compare-empty">No agents selected yet.<br/><br/>Go to <Link href="/">Explore</Link> or <Link href="/discover">Discover</Link> and tap the <strong>+</strong> button on up to 3 agent cards.</div>
   :<div className="compare-grid" style={{gridTemplateColumns:`repeat(${rows.length},minmax(0,1fr))`}}>
    {rows.map(r=>{
     const m=r.metadata;
     const capCount=(r.capabilities?.length||0)+(r.domains?.length||0)+(r.protocols?.length||0);
     return <div className="compare-col" key={r.agentId}>
      <div className="compare-col-head"><div className="avatar" style={{width:40,height:40,flex:"0 0 40px",borderRadius:11,fontSize:14}}>{initials(m?.name)}</div><button className="compare-remove" onClick={()=>remove(r.agentId)} title="Remove from comparison">✕</button></div>
      <h3>{m?.name||`Agent #${r.agentId}`}</h3>
      <div className="agent-id">ERC-8004 · Agent #{r.agentId}</div>

      <div className="compare-row"><span>Health</span>{r.health?<strong style={{color:r.health.summary.overallStatus==="LIVE"?"#087443":"#a15c00"}}>{r.health.summary.overallStatus} · {r.health.summary.healthScore}/100</strong>:<em style={{color:"#98a2b3"}}>Unknown</em>}</div>
      <div className="compare-row"><span>Live services</span><strong>{r.health?`${r.health.summary.liveCount}/${r.health.summary.probeCount}`:"—"}</strong></div>
      <div className="compare-row"><span>Capabilities</span>{r.capabilities?.length?<div className="tag-list" style={{margin:0}}>{r.capabilities.map(c=><span key={c} className="tag">{c}</span>)}</div>:<em style={{color:"#98a2b3"}}>Not declared</em>}</div>
      <div className="compare-row"><span>Domains</span>{r.domains?.length?<div className="tag-list" style={{margin:0}}>{r.domains.map(d=><span key={d} className="tag tag-domain">{d}</span>)}</div>:<em style={{color:"#98a2b3"}}>Not declared</em>}</div>
      <div className="compare-row"><span>Protocols</span>{r.protocols?.length?<div className="tag-list" style={{margin:0}}>{r.protocols.map(p=><span key={p} className="tag tag-protocol">{p}</span>)}</div>:<em style={{color:"#98a2b3"}}>Not declared</em>}</div>
      <div className="compare-row"><span>Active claim</span><strong>{m?.active?"Yes":"Not declared"}</strong></div>
      <div className="compare-row"><span>x402 support</span><strong>{m?.x402Support?"Supported":"Not declared"}</strong></div>
      <div className="compare-row"><span>Owner</span><strong>{short(r.owner)}</strong></div>
      {capCount===0&&<div className="compare-row" style={{color:"#a15c00"}}><span>Note</span>This agent has no declared capabilities/domains/protocols yet.</div>}

      <Link href={`/agents/${r.agentId}`} className="card-link" style={{display:"block",marginTop:16,fontSize:12.5}}>View full evidence →</Link>
     </div>;
    })}
   </div>}
  </main>
  <footer className="footer"><div className="container footer-inner"><span><strong>AgentLens</strong> — the evidence layer for BNB AI agents.</span><span>Built for the Smart Money Era</span></div></footer>
 </div>;
}
