sed -i '' -e '/filterDay  = signal<number | '"''"'>('"''"');/a\
  filterElegibilidad = signal<'"'todos'"' | '"'socios'"' | '"'staff'"'>('"''todos''"');\
' src/app/components/deportivo/actividades/deportivo-actividades.ts

sed -i '' -e '/return list;/i\
    if (this.filterElegibilidad() === '"'socios'"') {\
      list = list.filter(a => a.elegible_para_socios);\
    } else if (this.filterElegibilidad() === '"'staff'"') {\
      list = list.filter(a => !a.elegible_para_socios);\
    }\
' src/app/components/deportivo/actividades/deportivo-actividades.ts
