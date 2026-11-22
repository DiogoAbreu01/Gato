"""Gerador auxiliar de migração inicial, sem depender de servidor PG.
Revisar SQL e verificar drift com Prisma antes de produção.
"""
from pathlib import Path
import re
schema=Path(__file__).resolve().parents[1]/'prisma/schema.prisma'
source=schema.read_text()
enums={n:re.findall(r'^\s*(\w+)\s*$',body,re.M) for n,body in re.findall(r'enum\s+(\w+)\s*\{([^}]*)\}',source,re.S)}
models=dict(re.findall(r'model\s+(\w+)\s*\{(.*?)^\}',source,re.S|re.M))
columns={}
foreign=[];idx=[]
for model,body in models.items():
    fields=[];pk=[]
    for line in body.splitlines():
        line=line.strip()
        if not line or line.startswith('//'): continue
        if line.startswith('@@id'):
            pk=re.search(r'\[([^]]+)\]',line).group(1).replace(' ','').split(','); continue
        if line.startswith('@@index'):
            keys=re.search(r'\[([^]]+)\]',line).group(1).replace(' ','').split(',')
            idx.append(f'CREATE INDEX "{model}_{"_".join(keys)}_idx" ON "{model}" ({", ".join(chr(34)+k+chr(34) for k in keys)});'); continue
        match=re.match(r'(\w+)\s+(\w+)(\[\]|\?)?(.*)$',line)
        if not match:continue
        name,kind,modifier,rest=match.groups()
        if kind in models or modifier=='[]':
            if '@relation(' in rest and modifier!='[]':
                flds=re.search(r'fields:\s*\[([^]]+)\]',rest)
                refs=re.search(r'references:\s*\[([^]]+)\]',rest)
                if flds and refs:
                    ondel=(re.search(r'onDelete:\s*(\w+)',rest) or [None,'Restrict'])[1]
                    foreign.append((model,kind,flds[1].replace(' ','').split(','),refs[1].replace(' ','').split(','),ondel))
            continue
        type_map={'String':'TEXT','Int':'INTEGER','Boolean':'BOOLEAN','DateTime':'TIMESTAMP(3)','Decimal':'DECIMAL(14,2)','Json':'JSONB'}
        sqltype=f'"{kind}"' if kind in enums else type_map[kind]
        sql=f'"{name}" {sqltype}'
        if modifier!='?':sql+=' NOT NULL'
        if '@id' in rest:pk=[name]
        if '@unique' in rest:sql+=' UNIQUE'
        default=re.search(r'@default\(([^)]*)\)',rest)
        if default:
            dv=default.group(1)
            if dv=='now(': pass
            elif dv=='now()':sql+=' DEFAULT CURRENT_TIMESTAMP'
            elif dv=='true' or dv=='false':sql+=' DEFAULT '+dv.upper()
            elif re.fullmatch(r'\d+',dv):sql+=' DEFAULT '+dv
            elif dv=='uuid(':pass
            elif dv.startswith('"'):sql+=' DEFAULT '+dv.replace('"',"'")
            elif dv in enums.get(kind,[]):sql+=f' DEFAULT \'{dv}\'::"{kind}"'
        if '@default(now())' in rest:sql+=' DEFAULT CURRENT_TIMESTAMP' if 'DEFAULT' not in sql else ''
        fields.append(sql)
    if pk:fields.append('CONSTRAINT "'+model+'_pkey" PRIMARY KEY ('+', '.join(f'"{k}"' for k in pk)+')')
    columns[model]=fields
out=['-- Atlética OS — migração inicial (gerada com script/generate-migration.py)','-- Conferir com `npx prisma migrate diff` assim que dependências estiverem disponíveis.','']
for n,values in enums.items():out.append(f'CREATE TYPE "{n}" AS ENUM ({", ".join(repr(x) for x in values)});')
out.append('')
for model,fields in columns.items():out.append(f'CREATE TABLE "{model}" (\n    '+',\n    '.join(fields)+'\n);\n')
for m,ref,fs,rs,ondel in foreign:
    key='_'.join(fs)
    out.append(f'ALTER TABLE "{m}" ADD CONSTRAINT "{m}_{key}_fkey" FOREIGN KEY ({", ".join(chr(34)+k+chr(34) for k in fs)}) REFERENCES "{ref}"({", ".join(chr(34)+k+chr(34) for k in rs)}) ON DELETE {"SET NULL" if ondel=="SetNull" else ondel.upper()} ON UPDATE CASCADE;')
out.extend(idx)
out.append('ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "finance_amount_positive" CHECK ("amount" > 0);')
out.append('ALTER TABLE "DisciplinaryOccurrence" ADD CONSTRAINT "discipline_points_range" CHECK ("points" BETWEEN 0 AND 5);')
dest=schema.parent/'migrations/20261110000000_init/migration.sql';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text('\n'.join(out)+'\n');print(f'Migração gerada: {len(models)} tabelas, {len(enums)} enums, {len(foreign)} FKs, {len(idx)} índices')
