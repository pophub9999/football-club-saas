#!/usr/bin/env python3
import os,json,re,urllib.request,urllib.parse
from datetime import datetime,timezone
from bs4 import BeautifulSoup

SUPA=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SOURCE_URL="https://mapa.torreense.com/mapa"
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36","Accept":"text/html,*/*","Accept-Language":"pt-PT,pt;q=0.9"}
HEAD={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json"}

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=40) as r:
        return r.read().decode("utf-8","ignore")

def api(path,method="GET",data=None,prefer=None):
    body=None if data is None else json.dumps(data,ensure_ascii=False).encode()
    headers=dict(HEAD)
    if prefer: headers["Prefer"]=prefer
    req=urllib.request.Request(SUPA+"/rest/v1/"+path,data=body,method=method,headers=headers)
    with urllib.request.urlopen(req,timeout=40) as r:
        txt=r.read().decode()
        return json.loads(txt) if txt else None

def find_partners(node):
    if isinstance(node,dict):
        p=node.get("partners")
        if isinstance(p,list) and p and isinstance(p[0],dict) and "businessName" in p[0]:
            return p
        for v in node.values():
            got=find_partners(v)
            if got is not None:return got
    elif isinstance(node,list):
        for v in node:
            got=find_partners(v)
            if got is not None:return got
    return None

def extract_partners(html):
    soup=BeautifulSoup(html,"html.parser")
    prefix="self.__next_f.push("
    for sc in soup.find_all("script"):
        txt=sc.string or sc.get_text() or ""
        if "partners" not in txt or prefix not in txt:
            continue
        pos=0
        while True:
            i=txt.find(prefix,pos)
            if i<0:break
            raw=txt[i+len(prefix):]
            # One Next.js flight push per script in the current page. Use the
            # last closing parenthesis so brackets inside the encoded payload
            # cannot truncate the JSON.
            j=raw.rfind(")")
            if j<0:break
            raw=raw[:j].strip().rstrip(";")
            try:
                outer=json.loads(raw)
            except Exception:
                pos=i+len(prefix)
                continue
            if isinstance(outer,list) and len(outer)>=2 and isinstance(outer[1],str):
                payload=outer[1]
                candidate=payload.split(":",1)[1] if ":" in payload else payload
                try:
                    obj=json.loads(candidate)
                    partners=find_partners(obj)
                    if partners is not None:
                        return partners
                except Exception:
                    # Even if the whole RSC fragment changes, the decoded
                    # string still contains ordinary JSON for the partners.
                    marker='"partners":'
                    k=payload.find(marker)
                    if k>=0:
                        tail=payload[k+len(marker):].lstrip()
                        if tail.startswith("["):
                            try:
                                arr,_=json.JSONDecoder().raw_decode(tail)
                                if isinstance(arr,list) and arr:
                                    return arr
                            except Exception:
                                pass
            pos=i+len(prefix)

    raise RuntimeError("Could not extract Torreense partner JSON")

def pct_label(v):
    if v is None:return "VANTAGEM"
    n=float(v)
    shown=str(int(n)) if n.is_integer() else str(n).replace(".",",")
    return "−"+shown+"%"

def main():
    partners=extract_partners(get(SOURCE_URL))
    if len(partners)<50:
        raise RuntimeError("Partner list unexpectedly short: "+str(len(partners)))

    now=datetime.now(timezone.utc).isoformat()
    rows=[]
    for p in partners:
        sid=str(p.get("id") or "").strip()
        name=str(p.get("businessName") or "").strip()
        if not sid or not name:continue
        pct=p.get("discountPct")
        try:pct=float(pct) if pct is not None else None
        except:pct=None
        rows.append({
          "source":"torreense_partner_map",
          "source_id":sid,
          "business_name":name,
          "category":p.get("category") or None,
          "discount_pct":pct,
          "discount_label":pct_label(pct),
          "discount_conditions":p.get("discountConditions") or None,
          "address":p.get("address") or None,
          "locality":p.get("locality") or None,
          "latitude":p.get("latitude"),
          "longitude":p.get("longitude"),
          "maps_url":p.get("gmapsUrl") or None,
          "source_url":SOURCE_URL,
          "active":True,
          "raw_data":p,
          "updated_at":now
        })

    api("member_benefits?source=eq.torreense_partner_map","PATCH",{"active":False,"updated_at":now})
    # Send in chunks to stay well below request limits.
    for i in range(0,len(rows),50):
        api("member_benefits?on_conflict=source,source_id","POST",rows[i:i+50],"resolution=merge-duplicates,return=minimal")

    status={
      "source":"torreense_partner_map","last_sync":now,"last_success":now,
      "status":"success","message":"Official Torreense member benefits sync",
      "items_processed":len(rows),"updated_at":now
    }
    api("sync_status?on_conflict=source","POST",[status],"resolution=merge-duplicates,return=minimal")
    api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})
    print("BENEFITS_SYNCED",len(rows))
    print("BENEFIT_CATEGORIES",len(set(x["category"] for x in rows if x["category"])))
    print("BENEFIT_LOCALITIES",len(set(x["locality"] for x in rows if x["locality"])))

if __name__=="__main__":
    main()
