import{g as h}from"./index-DbmR5RNU.js";const d="/audit-proxy";function l(r){return d.startsWith("http://")||d.startsWith("https://")?`${d}${r}`:`${d}${r}`}async function f(r,a={}){const n=l(r),c=h(),o={Accept:"*/*",...a.headers};c&&(o.Authorization=`Bearer ${c}`);let t;try{t=await fetch(n,{...a,headers:o})}catch(i){const s=typeof window<"u"?window.location.origin:"unknown",u="Network error (often CORS, DNS, TLS, or server unreachable). If this is running in the browser, ensure the request is proxied via /audit-proxy in dev and via your production reverse proxy.",e=i instanceof Error?i.message:String(i);throw new Error(`Failed to fetch audit logs.
URL: ${n}
Origin: ${s}
Reason: ${e}
Hint: ${u}`)}if(!t.ok){const i=t.headers.get("content-type")||"",s=await t.text().catch(()=>"");let u=s;if(i.includes("application/json"))try{const e=JSON.parse(s);u=(e==null?void 0:e.message)||(e==null?void 0:e.error)||JSON.stringify(e)}catch{}throw new Error(`Audit API request failed.
URL: ${n}
Status: ${t.status} ${t.statusText}
Body: ${u||"(empty)"}`)}try{return await t.json()}catch{const s=await t.text().catch(()=>"");throw new Error(`Audit API returned a non-JSON response.
URL: ${n}
Status: ${t.status} ${t.statusText}
Body: ${s||"(empty)"}`)}}async function y(r){const a=new URLSearchParams;r&&Object.entries(r).forEach(([c,o])=>{o==null||o===""||a.append(c,String(o))});const n=a.toString();return f(`/api/audit-logs/all${n?`?${n}`:""}`,{method:"GET"})}export{y as a};
