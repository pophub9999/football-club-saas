#!/usr/bin/env python3
import urllib.request,re
UA={"User-Agent":"Mozilla/5.0","Accept":"text/html,*/*"}
urls=[
"https://www.torreense.com/sitemap.xml",
"https://www.torreense.com/futebol-profissional/seniores-feminino/plantel",
"https://www.torreense.com/futebol-profissional/seniores-feminino/calendario",
"https://www.torreense.com/futebol-profissional/seniores-feminino/jogos",
"https://www.torreense.com/futsal/seniores-futsal-masculinos/calendario",
"https://www.torreense.com/futsal/seniores-futsal-masculinos/jogos",
"https://www.torreense.com/futsal/seniores-feminino-futsal/calendario",
"https://www.torreense.com/futsal/seniores-feminino-futsal/jogos",
]
for u in urls:
    try:
        req=urllib.request.Request(u,headers=UA)
        with urllib.request.urlopen(req,timeout=20) as r:
            body=r.read().decode("utf-8","ignore")
            print("URL",u,"STATUS",getattr(r,"status",200),"BYTES",len(body))
            title=re.search(r"<title[^>]*>(.*?)</title>",body,re.I|re.S)
            h1=re.search(r"<h1[^>]*>(.*?)</h1>",body,re.I|re.S)
            if title: print("TITLE",re.sub(r"<[^>]+>"," ",title.group(1)).strip())
            if h1: print("H1",re.sub(r"<[^>]+>"," ",h1.group(1)).strip())
            if "sitemap" in u:
                found=sorted(set(re.findall(r"https?://[^<\s]+",body)))
                for x in found:
                    if any(k in x.lower() for k in ["seniores-feminino","futsal","calendario","plantel"]):
                        print("SITEMAP",x)
    except Exception as e:
        print("ERR",u,repr(e))
