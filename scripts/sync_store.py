#!/usr/bin/env python3
import os,re,json,urllib.request,urllib.parse,urllib.error
from datetime import datetime,timezone

BASE=os.environ["SUPABASE_URL"].rstrip("/")
KEY=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
STORE="https://torreense.360imprimir.pt"
UA={
 "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
 "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
 "Accept-Language":"pt-PT,pt;q=0.9,en;q=0.7",
 "Cache-Control":"no-cache"
}
HEAD={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json"}

def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=35) as r:
        return r.read().decode("utf-8","ignore")

def api(path,method="GET",data=None,prefer=None):
    body=None if data is None else json.dumps(data,ensure_ascii=False).encode()
    headers=dict(HEAD)
    if prefer: headers["Prefer"]=prefer
    req=urllib.request.Request(BASE+"/rest/v1/"+path,data=body,method=method,headers=headers)
    with urllib.request.urlopen(req,timeout=30) as r:
        txt=r.read().decode()
        return json.loads(txt) if txt else None

def js_string(raw):
    if raw is None:return None
    try:return json.loads('"'+raw+'"')
    except:
        return raw.replace('\\/','/').replace('\\\"','"')

def discover_categories(doc):
    out={}
    pat=re.compile(
      r'\{view_order:(\d+),category_name:"((?:\\.|[^"\\])*)",'
      r'category_description:"((?:\\.|[^"\\])*)",category_image_url:(?:null|"((?:\\.|[^"\\])*)"),'
      r'category_slug:"((?:\\.|[^"\\])*)".*?id:(\d+),number_of_products:(\d+)\}',
      re.S
    )
    for m in pat.finditer(doc):
        cid=m.group(6)
        out[cid]={
          "source_id":cid,
          "sort_order":int(m.group(1)),
          "name":js_string(m.group(2)),
          "description":js_string(m.group(3)),
          "image":js_string(m.group(4)) if m.group(4) else None,
          "slug":js_string(m.group(5)),
          "count":int(m.group(7))
        }
    return sorted(out.values(),key=lambda x:(x["sort_order"],x["name"]))

def extract_products(doc):
    out={}
    pat=re.compile(
      r'\{id:(\d+),label:"((?:\\.|[^"\\])*)",previewUrl:(?:null|"((?:\\.|[^"\\])*)"),'
      r'mockup_url:"((?:\\.|[^"\\])*)",is_customized:(true|false),quantity:"((?:\\.|[^"\\])*)",'
      r'deliveryDays:(\d+),totalPrice:(\d+),totalPriceWithVat:(\d+),positioning:',
      re.S
    )
    for m in pat.finditer(doc):
        pid=m.group(1)
        out[pid]={
          "source_id":pid,
          "name":js_string(m.group(2)),
          "preview_url":js_string(m.group(3)) if m.group(3) else None,
          "image_url":js_string(m.group(4)),
          "customized":m.group(5)=="true",
          "quantity":js_string(m.group(6)),
          "delivery_days":int(m.group(7)),
          "price_ex_vat":int(m.group(8))/100,
          "price":int(m.group(9))/100
        }
    return list(out.values())

def upsert_category(cat):
    now=datetime.now(timezone.utc).isoformat()
    payload={
      "source":"torreense_store",
      "source_id":cat["source_id"],
      "name":cat["name"],
      "url":STORE+"/categories/"+cat["slug"],
      "sort_order":cat["sort_order"],
      "active":True,
      "raw_data":{
        "slug":cat["slug"],
        "description":cat["description"],
        "image_url":cat["image"],
        "number_of_products":cat["count"],
        "source_platform":"360imprimir"
      },
      "updated_at":now
    }
    api("store_categories?on_conflict=source,source_id","POST",[payload],"resolution=merge-duplicates,return=minimal")
    rows=api("store_categories?select=id&source=eq.torreense_store&source_id=eq."+urllib.parse.quote(cat["source_id"],safe="")+"&limit=1") or []
    return rows[0]["id"] if rows else None

def sync():
    master=get(STORE+"/products")
    categories=discover_categories(master)
    if not categories:
        raise RuntimeError("No categories discovered on current Torreense store")

    now=datetime.now(timezone.utc).isoformat()
    api("store_categories?source=eq.torreense_store","PATCH",{"active":False,"updated_at":now})
    api("store_products?source=eq.torreense_store","PATCH",{"active":False,"updated_at":now})

    all_products={}
    category_rows={}
    expected=0

    for cat in categories:
        cid=upsert_category(cat)
        category_rows[cat["source_id"]]=cid
        expected+=cat["count"]
        url=STORE+"/categories/"+urllib.parse.quote(cat["slug"],safe="-")
        try:
            doc=get(url)
        except urllib.error.HTTPError as e:
            print("STORE_CATEGORY_FETCH_FAILED",cat["name"],e.code)
            continue
        products=extract_products(doc)
        print("STORE_CATEGORY",cat["name"],"expected",cat["count"],"parsed",len(products))
        for p in products:
            p["category_id"]=cid
            all_products[p["source_id"]]=p

    # The all-products page is a safety net for any product that is temporarily
    # missing from a category response.
    for p in extract_products(master):
        all_products.setdefault(p["source_id"],{**p,"category_id":None})

    if len(all_products)<20:
        raise RuntimeError("Unexpectedly small current store catalog: "+str(len(all_products)))

    rows=[]
    for p in all_products.values():
        pid=p["source_id"]
        rows.append({
          "source":"torreense_store",
          "source_id":pid,
          "category_id":p.get("category_id"),
          "name":p["name"],
          "slug":"product-"+pid,
          "url":STORE+"/editor?id="+pid+"&type=template",
          "description_text":None,
          "price":p["price"],
          "compare_at_price":None,
          "currency":"EUR",
          "stock_status":"Disponível",
          "in_stock":True,
          "image_url":p["image_url"],
          "images":[p["image_url"]] if p["image_url"] else [],
          "options":[],
          "active":True,
          "raw_data":{
            "source_platform":"360imprimir",
            "preview_url":p["preview_url"],
            "is_customized":p["customized"],
            "delivery_days":p["delivery_days"],
            "price_ex_vat":p["price_ex_vat"],
            "default_quantity":p["quantity"]
          },
          "updated_at":now
        })

    # Keep request bodies modest for PostgREST.
    for i in range(0,len(rows),40):
        api("store_products?on_conflict=source,source_id","POST",rows[i:i+40],"resolution=merge-duplicates,return=minimal")

    status={
      "source":"torreense_store",
      "last_sync":now,
      "last_success":now,
      "status":"success",
      "message":"Torreense 360imprimir catalog sync",
      "items_processed":len(rows),
      "updated_at":now
    }
    api("sync_status?on_conflict=source","POST",[status],"resolution=merge-duplicates,return=minimal")
    api("app_sync?id=eq.1","PATCH",{"version":int(datetime.now().timestamp()),"updated_at":now})
    print("STORE_SYNCED",len(rows),"CATEGORY_TOTAL",len(categories),"EXPECTED_CATEGORY_ROWS",expected)

if __name__=="__main__":
    sync()
