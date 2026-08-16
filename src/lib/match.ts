import { CAPABILITIES, INTENTS } from "@/lib/discovery";

export type MatchInput = {
  name?: string | null;
  description?: string | null;
  metadata?: unknown;
  health_status?: string | null;
  // Real evidence extracted during ingestion (see src/lib/metadata.ts).
  // Empty arrays mean "not yet resolved / declared nothing" — never
  // treated as a negative signal, just absence of positive evidence.
  capabilities?: string[] | null;
  domains?: string[] | null;
  protocols?: string[] | null;
};

const EXP: Record<string,string[]> = {
  defi:["defi","decentralized finance","liquidity","yield","staking","swap","dex","lending","borrowing","wallet","position"],
  trading:["trade","trading","swap","dex","market","arbitrage","strategy","execution","orders","portfolio"],
  monitor:["monitor","monitoring","watch","alert","track","position","wallet","health factor","liquidation","risk"],
  research:["research","analysis","analytics","news","intelligence","data","market intelligence","insights"]
};
const STOP=new Set(["the","and","for","with","from","that","this","need","want","find","agent","an","a","to","my","me","of","on","in"]);
function flat(v:unknown,o:string[]=[]):string[]{if(typeof v==="string")o.push(v);else if(Array.isArray(v))v.forEach(x=>flat(x,o));else if(v&&typeof v==="object")Object.values(v as Record<string,unknown>).forEach(x=>flat(x,o));return o;}
function norm(s:string){return s.toLowerCase().replace(/[^a-z0-9\s-]/g," ").replace(/\s+/g," ").trim()}
function terms(q:string){const n=norm(q);const words=n.split(" ").filter(w=>w.length>2&&!STOP.has(w));const expanded=Object.values(EXP).flatMap(xs=>xs.filter(x=>n.includes(x)));return [...new Set([...words,...expanded])]}

export function rankAgents(query:string,agents:MatchInput[]){
  const q=norm(query),ts=terms(query);
  return agents.map(agent=>{
    const name=norm(agent.name??""),desc=norm(agent.description??""),meta=norm(flat(agent.metadata).join(" "));
    const capabilities=(agent.capabilities??[]).map(norm);
    const domains=(agent.domains??[]).map(norm);
    const protocols=agent.protocols??[];
    const text=`${name} ${desc} ${meta} ${capabilities.join(" ")} ${domains.join(" ")}`;
    let score=0;
    const reasons:string[]=[];

    if(q&&name===q){score+=60;reasons.push("Exact name match")}
    else if(q&&name.includes(q)){score+=35;reasons.push("Name matches your request")}

    for(const t of ts){
      if(text.includes(t)){
        // Structured evidence (declared capability/domain) counts for
        // more than a keyword happening to appear in free text.
        const inCapability=capabilities.some(c=>c.includes(t));
        const inDomain=domains.some(d=>d.includes(t));
        if(inCapability||inDomain){
          score+=18;
          if(reasons.length<4)reasons.push(inCapability?`Declared capability matches "${t}"`:`Declared domain matches "${t}"`);
        }else if(name.includes(t)){
          score+=14;
          if(reasons.length<4)reasons.push(`Name matches "${t}"`);
        }else if(meta.includes(t)){
          score+=10;
          if(reasons.length<4)reasons.push(`Metadata matches "${t}"`);
        }else{
          score+=7;
          if(reasons.length<4)reasons.push(`Description matches "${t}"`);
        }
      }
    }

    // Bonus for inferred CAPABILITIES coverage (keyword-based fallback list).
    score+=Math.min(CAPABILITIES.filter(c=>c.terms.some(t=>text.includes(t))).length*2,10);

    if(protocols.length){
      score+=Math.min(protocols.length*1.5,6);
    }

    if(agent.health_status==="LIVE"){score+=8;reasons.push("Currently reachable")}
    else if(agent.health_status==="TIMEOUT")score+=2;

    return{agent,matchScore:Math.min(100,Math.round(score)),matchReasons:[...new Set(reasons)].slice(0,4)};
  }).sort((a,b)=>b.matchScore-a.matchScore);
}

export function intentLabel(query:string){const q=norm(query);const hit=INTENTS.find(i=>q.includes(i.query)||EXP[i.id]?.some(t=>q.includes(t)));return hit?.label??null}