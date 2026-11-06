
const $=id=>document.getElementById(id);
const DB='alizee-gastos-v1';
let data={expenses:[],payments:[]};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>iso(new Date());
let activeDate=today(),lastToday=activeDate;
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const cents=x=>Math.round(Number(x||0)*100);
const money=c=>'Bs '+(c/100).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2});
const sum=a=>a.reduce((s,x)=>s+cents(x.amount),0);
const dre=/^\d{4}-\d{2}-\d{2}$/;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function load(){let x=null;try{x=localStorage.getItem(DB)}catch(e){}if(!x)return;try{const d=JSON.parse(x);data={expenses:Array.isArray(d.expenses)?d.expenses:[],payments:Array.isArray(d.payments)?d.payments:[]}}catch(e){try{localStorage.setItem(DB+'-corrupto',x)}catch(_){}alert('No se pudieron leer los datos guardados. Se conservó una copia aparte. Si tienes una copia de seguridad, restáurala en Respaldo.')}}
function save(){try{localStorage.setItem(DB,JSON.stringify(data))}catch(e){alert('No se pudo guardar: el almacenamiento del teléfono está lleno. Descarga una copia en Respaldo y elimina registros con fotos.');return false}render();return true}
function photo(file){return new Promise((res,rej)=>{if(!file)return res('');const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const k=Math.min(1,1000/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.6))};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'))};im.src=u})}
async function readPhoto(id){try{return await photo($(id).files[0])}catch(e){alert('No se pudo leer la foto. Prueba con otra imagen.');return null}}
const dayExpenses=d=>data.expenses.filter(x=>x.date===d);
const dayPayments=d=>data.payments.filter(x=>x.date===d);
function formatDate(date){const d=new Date(date+'T12:00:00');return `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`}
function reportHTML(date){
 const ex=dayExpenses(date),pay=dayPayments(date),t=sum(ex),f=Math.floor(t/2),m=t-f,r=sum(pay);
 return `<h3>Gastos diarios Alizee</h3><div class="date">${formatDate(date)}</div>
 <div style="margin-top:12px"><b>Detalle de gastos</b>${ex.length?ex.map(x=>`<div class="reportline"><span>${esc(x.category)} — ${esc(x.description)}</span><b>${money(cents(x.amount))}</b></div>`).join(''):'<p class="small">No hay gastos registrados para esta fecha.</p>'}</div>
 <div class="reportline reporttotal"><span>Total día</span><span>${money(t)}</span></div>
 <div class="reportline"><span>Parte correspondiente al padre (50%)</span><b>${money(f)}</b></div>
 <div class="reportline"><span>Parte correspondiente a la madre (50%)</span><b>${money(m)}</b></div>
 <div style="margin-top:13px"><b>Aportes recibidos del papá en esta fecha</b>${pay.length?pay.map(x=>`<div class="reportline"><span>${esc(x.method||'Aporte recibido')}</span><b>${money(cents(x.amount))}</b></div>`).join(''):'<p class="small">No hay aportes registrados para esta fecha.</p>'}</div>
 <div class="reportline"><span>Total recibido hoy</span><b>${money(r)}</b></div>
 <p class="small" style="margin-top:12px">Este resumen refleja los gastos registrados y los aportes recibidos en la fecha indicada. El balance acumulado se consulta en la sección Balance.</p>`;
}
function renderDaily(){$('dailyReport').innerHTML=reportHTML(activeDate);$('dayHeading').textContent=activeDate===today()?'Hoy':new Date(activeDate+'T12:00:00').toLocaleDateString('es-BO',{weekday:'long'});$('dayDate').textContent=formatDate(activeDate)}
function renderHistory(){
 const d=$('historyDate').value,items=[...data.expenses.map(x=>({...x,type:'Gasto'})),...data.payments.map(x=>({...x,type:'Aporte'}))].filter(x=>!d||x.date===d).sort((a,b)=>b.date.localeCompare(a.date));
 $('historyList').innerHTML=items.length?items.map(x=>{const a=`data-id="${esc(x.id)}" data-type="${x.type}"`;return `<div class="item"><div class="itemtop"><div><strong>${x.type}: ${esc(x.description||x.method||x.category||'Aporte')}</strong><div class="meta">${formatDate(x.date)} · ${esc(x.category||x.method||'')}</div></div><b>${money(cents(x.amount))}</b></div>${typeof x.photo==='string'&&x.photo.startsWith('data:image/')?`<img class="thumb" loading="lazy" src="${esc(x.photo)}" alt="Comprobante">`:''}<div class="actions"><button class="secondary" data-act="edit" ${a}>Editar</button><button class="danger" data-act="del" ${a}>Eliminar</button></div></div>`}).join(''):'<p class="small">No hay movimientos para mostrar.</p>';
}
function renderBalance(){
 const t=sum(data.expenses),share=Math.floor(t/2),rec=sum(data.payments),pend=share-rec;
 $('balanceStats').innerHTML=`<div class="stat"><span>Gasto total registrado</span><strong>${money(t)}</strong></div><div class="stat"><span>50% correspondiente al papá</span><strong>${money(share)}</strong></div><div class="stat"><span>Aportes recibidos</span><strong>${money(rec)}</strong></div><div class="stat"><span>${pend>=0?'Saldo pendiente':'Aporte excedente'}</span><strong>${money(Math.abs(pend))}</strong></div>`;
 $('balanceDetails').innerHTML=`<div class="reportline"><span>Parte correspondiente a mamá</span><b>${money(t-share)}</b></div><p class="small">El saldo pendiente se calcula como el 50% del gasto total menos los aportes registrados. Si el resultado es negativo, se muestra como aporte excedente. Revisa que los aportes correspondan a estos gastos antes de usar el saldo como liquidación.</p>`;
}
function renderBackup(){$('usage').textContent=`Almacenamiento usado: aprox. ${Math.min(100,Math.round(JSON.stringify(data).length/5e4))}% del espacio de la app en este teléfono.`}
function render(){renderDaily();if(!$('history').classList.contains('hidden'))renderHistory();renderBalance();renderBackup()}
function shiftDay(n){const d=new Date(activeDate+'T12:00:00');d.setDate(d.getDate()+n);activeDate=iso(d);render()}
function checkDay(){const t=today();if(t!==lastToday){if(activeDate===lastToday)activeDate=t;lastToday=t;render()}}
setInterval(checkDay,60000);document.addEventListener('visibilitychange',checkDay);
$('addExpense').onclick=async()=>{const amount=Math.round(Number($('amount').value)*100)/100,description=$('description').value.trim();if(!description||!(amount>0)){alert('Completa la descripción y un importe válido.');return}const p=await readPhoto('expensePhoto');if(p===null)return;data.expenses.push({id:uid(),date:activeDate,category:$('category').value,description,amount,photo:p});if(!save()){data.expenses.pop();return}$('description').value='';$('amount').value='';$('expensePhoto').value=''};
$('addPayment').onclick=async()=>{const amount=Math.round(Number($('paymentAmount').value)*100)/100;if(!(amount>0)){alert('Ingresa un importe válido.');return}const p=await readPhoto('paymentPhoto');if(p===null)return;data.payments.push({id:uid(),date:activeDate,method:$('paymentMethod').value.trim(),amount,photo:p});if(!save()){data.payments.pop();return}$('paymentAmount').value='';$('paymentMethod').value='';$('paymentPhoto').value=''};
$('historyList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.type==='Gasto'?'expenses':'payments',it=data[k].find(x=>x.id===b.dataset.id);if(!it)return;
 if(b.dataset.act==='del'){if(!confirm('¿Eliminar este registro?'))return;const old=data[k];data[k]=old.filter(x=>x!==it);if(!save())data[k]=old;return}
 const f=k==='expenses'?'description':'method',t=prompt(k==='expenses'?'Descripción:':'Medio de pago / referencia:',it[f]||'');if(t===null)return;const a=Math.round(Number(prompt('Importe (Bs):',it.amount))*100)/100;if(!(a>0)||(k==='expenses'&&!t.trim())){alert('Datos no válidos.');return}const o={...it};it[f]=t.trim();it.amount=a;if(!save())Object.assign(it,o)};
$('historyDate').onchange=renderHistory;
$('prevDay').onclick=()=>shiftDay(-1);
$('nextDay').onclick=()=>{if(activeDate<today())shiftDay(1)};
$('printReport').onclick=()=>window.print();
$('shareReport').onclick=async()=>{const ex=dayExpenses(activeDate),t=sum(ex),f=Math.floor(t/2);const text=`GASTOS DIARIOS ALIZEE\n${formatDate(activeDate)}\n`+ex.map(x=>`${x.category} — ${x.description}: ${money(cents(x.amount))}`).join('\n')+`\n\nTotal gastado: ${money(t)}\nPapá (50%): ${money(f)}\nMamá (50%): ${money(t-f)}\nAportes recibidos: ${money(sum(dayPayments(activeDate)))}`;if(navigator.share){try{await navigator.share({title:'Gastos diarios Alizee',text})}catch(e){}}else{try{await navigator.clipboard.writeText(text);alert('Resumen copiado. Puedes pegarlo en WhatsApp.')}catch(e){alert('No se pudo copiar el resumen.')}}};
$('exportBackup').onclick=()=>{const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString(),format:1},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`respaldo-alizee-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const clean=(arr,k)=>arr.filter(x=>x&&typeof x==='object'&&dre.test(x.date)&&Number(x.amount)>0).map(x=>({id:typeof x.id==='string'&&x.id?x.id:uid(),date:x.date,...(k==='e'?{category:String(x.category||'Otros'),description:String(x.description||'')}:{method:String(x.method||'')}),amount:Math.round(Number(x.amount)*100)/100,photo:typeof x.photo==='string'&&x.photo.startsWith('data:image/')?x.photo:''}));
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!Array.isArray(x.expenses)||!Array.isArray(x.payments))throw 0;if(!confirm('Esto reemplazará los registros actuales. ¿Continuar?')){e.target.value='';return}const old=data;data={expenses:clean(x.expenses,'e'),payments:clean(x.payments,'p')};if(save())alert('Copia restaurada.');else data=old}catch(err){alert('El archivo no parece una copia válida.')}e.target.value=''};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));['daily','history','balance','backup'].forEach(id=>$(id).classList.toggle('hidden',id!==b.dataset.tab));render()});
load();render();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
