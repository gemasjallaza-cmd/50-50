const $=id=>document.getElementById(id);
const DB='alizee-gastos-v1';
let data={expenses:[],payments:[]};
const today=()=>{let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let activeDate=today();
const money=n=>'Bs '+Number(n||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2});
function load(){try{const x=localStorage.getItem(DB);if(x)data=JSON.parse(x)}catch(e){alert('No se pudieron leer los datos guardados. Importa tu copia de seguridad si tienes una.')} }
function save(){localStorage.setItem(DB,JSON.stringify(data));render()}
function photo(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function sum(arr){return arr.reduce((s,x)=>s+Number(x.amount),0)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dayExpenses(date){return data.expenses.filter(x=>x.date===date)}
function dayPayments(date){return data.payments.filter(x=>x.date===date)}
function reportHTML(date){
 const ex=dayExpenses(date),pay=dayPayments(date),total=sum(ex),share=total/2,received=sum(pay);
 return `<h3>Gastos diarios Alizee</h3><div class="date">${date}</div>
 <div style="margin-top:12px"><b>Detalle de gastos</b>${ex.length?ex.map(x=>`<div class="reportline"><span>${esc(x.category)} — ${esc(x.description)}</span><b>${money(x.amount)}</b></div>`).join(''):'<p class="small">No hay gastos registrados para esta fecha.</p>'}</div>
 <div class="reportline reporttotal"><span>Total día</span><span>${money(total)}</span></div>
 <div class="reportline"><span>Parte correspondiente al padre (50%)</span><b>${money(share)}</b></div>
 <div class="reportline"><span>Parte correspondiente a la madre (50%)</span><b>${money(share)}</b></div>
 <div style="margin-top:13px"><b>Aportes recibidos del papá en esta fecha</b>${pay.length?pay.map(x=>`<div class="reportline"><span>${esc(x.method||'Aporte recibido')}</span><b>${money(x.amount)}</b></div>`).join(''):'<p class="small">No hay aportes registrados para esta fecha.</p>'}</div>
 <div class="reportline"><span>Total recibido hoy</span><b>${money(received)}</b></div>
 <p class="small" style="margin-top:12px">Este resumen refleja los gastos registrados y los aportes recibidos en la fecha indicada. El balance acumulado se consulta en la sección Balance.</p>`;
}
function formatDate(date){const d=new Date(date+'T12:00:00');return `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`}
function updateDayHeader(){
 const t=today();
 $('dayHeading').textContent=activeDate===t?'Hoy':new Date(activeDate+'T12:00:00').toLocaleDateString('es-BO',{weekday:'long'});
 $('dayDate').textContent=formatDate(activeDate);
}
function shiftDay(delta){const d=new Date(activeDate+'T12:00:00');d.setDate(d.getDate()+delta);activeDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;render()}
function renderDaily(){$('dailyReport').innerHTML=reportHTML(activeDate);updateDayHeader()}
function renderHistory(){
 const date=$('historyDate').value;let items=[...data.expenses.map(x=>({...x,type:'Gasto'})),...data.payments.map(x=>({...x,type:'Aporte'}))].filter(x=>!date||x.date===date).sort((a,b)=>b.date.localeCompare(a.date));
 $('historyList').innerHTML=items.length?items.map(x=>`<div class="item"><div class="itemtop"><div><strong>${x.type}: ${esc(x.description||x.category||x.method||'Aporte')}</strong><div class="meta">${x.date} · ${esc(x.category||x.method||'')}</div></div><b>${money(x.amount)}</b></div>${x.photo?`<img class="thumb" src="${x.photo}" alt="Comprobante">`:''}<div class="actions"><button class="danger" data-del="${x.id}" data-type="${x.type}">Eliminar</button></div></div>`).join(''):'<p class="small">No hay movimientos para mostrar.</p>';
 $('historyList').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('¿Eliminar este registro?'))return;const k=b.dataset.type==='Gasto'?'expenses':'payments';data[k]=data[k].filter(x=>x.id!==b.dataset.del);save()})
}
function renderBalance(){
 const expenses=sum(data.expenses),share=expenses/2,received=sum(data.payments),pending=share-received;
 $('balanceStats').innerHTML=`<div class="stat"><span>Gasto total registrado</span><strong>${money(expenses)}</strong></div><div class="stat"><span>50% correspondiente al papá</span><strong>${money(share)}</strong></div><div class="stat"><span>Aportes recibidos</span><strong>${money(received)}</strong></div><div class="stat"><span>${pending>=0?'Saldo pendiente':'Aporte excedente'}</span><strong>${money(Math.abs(pending))}</strong></div>`;
 $('balanceDetails').innerHTML=`<div class="reportline"><span>Parte correspondiente a mamá</span><b>${money(share)}</b></div><p class="small">El saldo pendiente se calcula como el 50% del gasto total menos los aportes registrados. Si el resultado es negativo, se muestra como aporte excedente. Revisa que los aportes correspondan a estos gastos antes de usar el saldo como liquidación.</p>`
}
function render(){renderDaily();renderHistory();renderBalance()}

$('addExpense').onclick=async()=>{let amount=Number($('amount').value),description=$('description').value.trim();if(!description||!(amount>0)){alert('Completa la descripción y un importe válido.');return}let p=await photo($('expensePhoto').files[0]);data.expenses.push({id:crypto.randomUUID(),date:activeDate,category:$('category').value,description,amount,photo:p});$('description').value='';$('amount').value='';$('expensePhoto').value='';save()};
$('addPayment').onclick=async()=>{let amount=Number($('paymentAmount').value);if(!(amount>0)){alert('Ingresa un importe válido.');return}let p=await photo($('paymentPhoto').files[0]);data.payments.push({id:crypto.randomUUID(),date:activeDate,method:$('paymentMethod').value.trim(),amount,photo:p});$('paymentAmount').value='';$('paymentMethod').value='';$('paymentPhoto').value='';save()};
$('historyDate').onchange=renderHistory;
$('prevDay').onclick=()=>shiftDay(-1);
$('nextDay').onclick=()=>{if(activeDate<today())shiftDay(1)};
$('printReport').onclick=()=>window.print();
$('shareReport').onclick=async()=>{let text=`GASTOS DIARIOS ALIZEE\n${activeDate}\n`+dayExpenses(activeDate).map(x=>`${x.category} — ${x.description}: ${money(x.amount)}`).join('\n')+`\n\nTotal gastado: ${money(sum(dayExpenses(activeDate)))}\n50% correspondiente a cada progenitor: ${money(sum(dayExpenses(activeDate))/2)}\nAportes recibidos hoy: ${money(sum(dayPayments(activeDate)))}`;if(navigator.share){try{await navigator.share({title:'Gastos diarios Alizee',text})}catch(e){}}else{await navigator.clipboard.writeText(text);alert('Resumen copiado. Puedes pegarlo en WhatsApp.')}};
$('exportBackup').onclick=()=>{let blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString(),format:1},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`respaldo-alizee-${today()}.json`;a.click();URL.revokeObjectURL(a.href)};
$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let x=JSON.parse(await f.text());if(!Array.isArray(x.expenses)||!Array.isArray(x.payments))throw 0;if(!confirm('Esto reemplazará los registros actuales. ¿Continuar?'))return;data={expenses:x.expenses,payments:x.payments};save();alert('Copia restaurada.')}catch(err){alert('El archivo no parece una copia válida.')}e.target.value=''};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));['daily','history','balance','backup'].forEach(id=>$(id).classList.toggle('hidden',id!==b.dataset.tab));render()});
load();render();
if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
