#!/usr/bin/env python3
import os,json,urllib.request
base=os.environ["SUPABASE_URL"].rstrip("/")
key=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
req=urllib.request.Request(
    base+"/rest/v1/",
    headers={
        "apikey":key,
        "Authorization":"Bearer "+key,
        "Accept":"application/openapi+json"
    }
)
with urllib.request.urlopen(req,timeout=30) as r:
    doc=json.load(r)
defs=doc.get("definitions",{})
for name in ("sports","teams","competitions","matches","players","standings"):
    d=defs.get(name,{})
    props=d.get("properties",{})
    print("SCHEMA",name,json.dumps({k:{"type":v.get("type"),"format":v.get("format")} for k,v in props.items()},ensure_ascii=False,sort_keys=True))
    print("REQUIRED",name,d.get("required",[]))
