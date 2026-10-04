
const CAKES=[{"id":"su-kem","name":"Bánh su kem","cost":8,"price":18,"profit":10,"file":"assets/su-kem.png","unlockDay":1},{"id":"donut","name":"Bánh donut","cost":10,"price":24,"profit":14,"file":"assets/donut.png","unlockDay":3},{"id":"cupcake","name":"Cupcake","cost":9,"price":25,"profit":16,"file":"assets/cupcake.png","unlockDay":5},{"id":"tart-trung","name":"Bánh tart trứng","cost":12,"price":29,"profit":17,"file":"assets/tart-trung.png","unlockDay":7},{"id":"croissant","name":"Croissant","cost":10,"price":27,"profit":17,"file":"assets/croissant.png","unlockDay":9},{"id":"panna-cotta","name":"Panna Cotta","cost":14,"price":35,"profit":21,"file":"assets/panna-cotta.png","unlockDay":11},{"id":"macaron","name":"Macaron","cost":11,"price":31,"profit":20,"file":"assets/macaron.png","unlockDay":13},{"id":"tiramisu","name":"Tiramisu","cost":16,"price":39,"profit":23,"file":"assets/tiramisu.png","unlockDay":15},{"id":"red-velvet","name":"Red Velvet","cost":18,"price":45,"profit":27,"file":"assets/red-velvet.png","unlockDay":12}];
const SKINS=[{"id":"classic","name":"Basic","file":"assets/cabinet_skins/classic.png","cost":0,"attract":0,"durability":15},{"id":"silver","name":"Bạc","file":"assets/cabinet_skins/silver.png","cost":500,"attract":3,"durability":18},{"id":"strawberry","name":"Strawberry","file":"assets/cabinet_skins/strawberry.png","cost":700,"attract":5,"durability":24},{"id":"green-frog","name":"Green Frog","file":"assets/cabinet_skins/green-frog.png","cost":900,"attract":8,"durability":27},{"id":"kitten","name":"Kitten","file":"assets/cabinet_skins/kitten.png","cost":950,"attract":10,"durability":24},{"id":"puggy","name":"Puggy","file":"assets/cabinet_skins/puggy.png","cost":1200,"attract":10,"durability":30},{"id":"cow","name":"Cow","file":"assets/cabinet_skins/cow.png","cost":1550,"attract":12,"durability":36},{"id":"ocean","name":"Ocean","file":"assets/cabinet_skins/ocean.png","cost":1850,"attract":15,"durability":45},{"id":"luxury","name":"Luxury","file":"assets/cabinet_skins/luxury.png","cost":2500,"attract":18,"durability":50},{"id":"cosmic","name":"Cosmic","file":"assets/cabinet_skins/cosmic.png","cost":3200,"attract":22,"durability":60}];
let shopName='Tiệm Bánh Mộng Mơ',money=300,level=1,combo=0,served=0,missed=0,sold=0,day=1;
let rating=3.5;
// Mỗi lô bánh có ngày nhập riêng, hạn dùng 3 ngày kể từ ngày nhập.
let batches=Object.fromEntries(CAKES.map(c=>[c.id,[]]));
let stock=Object.fromEntries(CAKES.map(c=>[c.id,0]));
let shelf=Object.fromEntries(CAKES.map(c=>[c.id,false]));
let expiredHandledDay=0;
let order=[],orderSeconds=30,maxOrderSeconds=30,gameMinutes=8*60,lastT=0,running=false,shopOpen=false,currentSkin=SKINS[0],orderExpired=false;
let queue=[],arrivalWait=3,goodSinceReview=0,dayServed=0,reviewCount=0,loopToken=0,earlyClosedDay=false;
let nextReviewerCheckDay=4;
let revenueHistory=[], salesHistory=[], customerForecastTomorrow=40, pendingBeggarReward=false, beggarAccepted=false, eventShownToday=false;
let reviewData=[];
let cabinetEventTimer=30,cabinetEventBusy=false,repairTimer=20,repairInterval=null,repairSelected=null,repairPairsDone=0,repairWires=[],lastBillingDay=0;
let apologyPending=false,apologyDeadline=0,apologyCustomerName='',apologyCustomerType='easy';
let theme=localStorage.getItem('theme')||'brown';
const CUSTOMER_TYPES={easy:{name:'Khách dễ tính',icon:'🙂',chance:60},hard:{name:'Khách khó tính',icon:'😤',chance:38},vip:{name:'Khách VIP',icon:'👑',chance:2}};
const typeMessages={easy:'Không sao, ai cũng mắc sai lầm mà.',hard:'Thế mà cũng làm sai hừ!',vip:'Tôi là khách VIP — làm nhanh giúp tôi nhé!'};
function pickCustomerType(){const r=Math.random()*100;return r<60?'easy':r<98?'hard':'vip'}
function forecastCustomers(dayNum){return 38+Math.floor(Math.random()*6)}
function recordSale(c,qty,amount){let row=salesHistory.find(x=>x.day===dayNumSafe()&&x.id===c.id);if(!row){row={day:dayNumSafe(),id:c.id,name:c.name,qty:0,revenue:0};salesHistory.push(row)}row.qty+=qty;row.revenue+=amount;revenueHistory.push({day:dayNumSafe(),id:c.id,name:c.name,amount,qty,time:Date.now()})}
function dayNumSafe(){return day}
function periodSales(period){const start=period==='day'?day:period==='week'?Math.max(1,day-6):Math.max(1,day-29);const rows={};for(const r of salesHistory)if(r.day>=start&&r.day<=day){rows[r.id]??={name:r.name,qty:0,revenue:0};rows[r.id].qty+=r.qty;rows[r.id].revenue+=r.revenue}return Object.values(rows).sort((a,b)=>b.qty-a.qty)}
function revenueSummary(){return {day:periodSales('day'),week:periodSales('week'),month:periodSales('month')}}
function customerLabel(c){return CUSTOMER_TYPES[c.type]?.icon+' '+CUSTOMER_TYPES[c.type]?.name||'Khách'}

const $=id=>document.getElementById(id),cakeById=id=>CAKES.find(c=>c.id===id);
const people=['👩 Mai','👨 Nam','👩 Linh','🧑 An','👵 Bà Lan','👨 Minh','👩 Vy','🧑 Khách VIP','🧒 Bông','👩 Cô Hạnh'];
const commentsGood=['Bánh ngon, tủ trưng bày xinh quá!','Phục vụ nhanh và đúng món, 5 sao nhé!','Vị bánh tuyệt vời, lần sau mình quay lại.','Tiệm dễ thương, mình rất hài lòng!','Đóng gói cẩn thận, bánh còn tươi.'];
const commentsBad=['Mình phải chờ hơi lâu…','Tiệm cần chú ý đơn hàng hơn nhé.','Hôm nay chưa được hài lòng lắm.','Mình gọi món khác mà tiệm lại đưa nhầm bánh.','Hết bánh đúng lúc mình gọi, hơi thất vọng.','Bánh không còn tươi nên mình không hài lòng.'];

let musicOn=true;
let bgmAudio=null, bellAudio=null, chaChingAudio=null;
function ensureAudio(){
  if(!bgmAudio){
    bgmAudio=new Audio('assets/audio/croissant-clouds.mp3');
    bgmAudio.loop=true;
    bgmAudio.preload='auto';
    bgmAudio.volume=.35;
  }
  if(!bellAudio){
    bellAudio=new Audio('assets/audio/hand-bell-ringing.mp3');
    bellAudio.preload='auto';
    bellAudio.volume=.65;
  }
  if(!chaChingAudio){
    chaChingAudio=new Audio('assets/audio/cha-ching.mp3');
    chaChingAudio.preload='auto';
    chaChingAudio.volume=.7;
  }
}
function playSfx(audio){
  if(!audio)return;
  try{audio.currentTime=0;audio.play().catch(()=>{});}catch(e){}
}
function doorChime(){ensureAudio();playSfx(bellAudio)}
function playChaChing(){ensureAudio();playSfx(chaChingAudio)}
function startMusic(){
  ensureAudio();
  musicOn=true;
  if(bgmAudio){bgmAudio.loop=true;bgmAudio.play().catch(()=>{});}
  const b=$('musicBtn');if(b)b.textContent='🎵 Nhạc: Bật';
}
function stopMusic(){
  musicOn=false;
  if(bgmAudio){bgmAudio.pause();bgmAudio.currentTime=0;}
  const b=$('musicBtn');if(b)b.textContent='🔇 Nhạc: Tắt';
}
function toggleMusic(){ensureAudio();if(musicOn)stopMusic();else startMusic()}
function isCakeUnlocked(c){return day>=c.unlockDay}
function moneyText(){$('money').textContent=Math.floor(money);$('level').textContent=level;$('combo').textContent=combo;$('dayNumber').textContent=day;$('durability').textContent=currentSkin.durability}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1400)}
function log(t){const d=document.createElement('div');d.textContent=t;$('log').prepend(d)}
function setRating(delta,why){rating=Math.max(0,Math.min(5,Math.round((rating+delta)*10)/10));const stars='★'.repeat(Math.floor(rating))+(rating%1>=.5?'½':'')+'☆'.repeat(5-Math.ceil(rating));if($('rating'))$('rating').textContent=rating.toFixed(1);if($('stars'))$('stars').textContent=stars;if($('ratingBar'))$('ratingBar').style.width=(rating/5*100)+'%';if($('ratingPage'))$('ratingPage').textContent=rating.toFixed(1);if($('starsPage'))$('starsPage').textContent=stars;if($('ratingBarPage'))$('ratingBarPage').style.width=(rating/5*100)+'%';if(why)log((delta>0?'⭐ ':'⚠️ ')+why+' ('+(delta>0?'+':'')+delta.toFixed(1)+'★)');if(rating<2.5)lose('💥 Tiệm bị phốt')}
function syncStock(){for(const c of CAKES)stock[c.id]=(batches[c.id]||[]).reduce((n,b)=>n+b.qty,0);for(const c of CAKES)if(stock[c.id]<=0)shelf[c.id]=false}
function renderCakes(){
 syncStock();
 const stocked=CAKES.filter(c=>isCakeUnlocked(c)&&(stock[c.id]||0)>0&&shelf[c.id]);
 $('cakes').innerHTML=stocked.length?stocked.map(c=>{
  const soon=(batches[c.id]||[]).filter(b=>b.bornDay+3===day+1).reduce((n,b)=>n+b.qty,0);
  const expired=(batches[c.id]||[]).filter(b=>day>=b.bornDay+3).reduce((n,b)=>n+b.qty,0);
  const status=expired?`⚠️ Quá hạn: ${expired}`:soon?`⏳ Mai hết hạn: ${soon}`:'🥐 Còn hạn';
  const removeDisabled=shopOpen&&!expired?'disabled':'';
  const removeTitle=expired?'⚡ Gỡ nhanh bánh quá hạn khỏi kệ':'Gỡ bánh khỏi kệ';
  return `<div class="cake ${expired?'expired-cake':''}"><span class="stock">x${stock[c.id]}</span><img src="${c.file}" alt="${c.name}"><b>${c.name}</b><span class="price">${c.price} xu · lãi ${c.profit}</span><span class="muted">${status}</span><button class="shop-btn" style="background:#4b302a;color:#fff;margin-top:6px;width:100%" onclick="serve('${c.id}')" ${!shopOpen?'disabled':''}>🍰 Bán bánh</button><button class="remove-shelf ${expired?'expired-remove':''}" title="${removeTitle}" aria-label="${removeTitle} ${c.name}" onclick="removeFromShelf('${c.id}')" ${removeDisabled}>×</button></div>`;
 }).join(''):`<div class="empty-shelf"><div style="font-size:46px">🧺</div><b>Kệ đang trống</b><p class="muted">Hãy vào tab <b>Nhập hàng</b> để nhập bánh hoặc đưa bánh đã nhập lên kệ.</p></div>`;
 renderShelfManager();
}
function renderShelfManager(){const el=$('shelfManager');if(!el)return;const rows=CAKES.filter(c=>isCakeUnlocked(c)&&(stock[c.id]||0)>0).map(c=>`<div class="restock-row"><span><b>${c.name}</b><br><small>Kho: ${stock[c.id]} · ${shelf[c.id]?'Đang ở trên kệ':'Đang cất trong kho'}</small></span><button class="secondary" onclick="${shelf[c.id]?`removeFromShelf('${c.id}')`:`putOnShelf('${c.id}')`}">${shelf[c.id]?'📥 Gỡ khỏi kệ':'🍰 Đưa lên kệ'}</button></div>`).join('');el.innerHTML=rows||'<p class="muted">Chưa có bánh đã mở khóa trong kho.</p>'}
function removeFromShelf(id){const expired=(batches[id]||[]).some(b=>day>=b.bornDay+3&&b.qty>0);if(shopOpen&&!expired){toast('🔒 Chỉ có thể thay đổi kệ khi tiệm đã đóng cửa.');return}if(order.some(o=>o.id===id)){toast('Món này đang nằm trong đơn hiện tại.');return}shelf[id]=false;renderCakes();renderRestockChoices();toast(expired?'⚠️ Đã gỡ nhanh bánh quá hạn khỏi kệ.':'📥 Đã gỡ bánh khỏi kệ, bánh vẫn còn trong kho.')}
function putOnShelf(id){if(shopOpen){toast('🔒 Chỉ có thể thay đổi kệ khi tiệm đã đóng cửa.');return}if((stock[id]||0)<=0){toast('Kho không còn bánh này.');return}shelf[id]=true;renderCakes();renderRestockChoices();toast('🍰 Đã đưa bánh lên kệ.')}
function renderTable(){const el=$('priceTable');if(!el)return;el.innerHTML=CAKES.map(c=>`<tr><td>${c.name}</td><td>${c.cost}</td><td>${c.price}</td><td class="profit">+${c.profit}</td><td>${isCakeUnlocked(c)?'Đã mở':'Ngày '+c.unlockDay}</td></tr>`).join('')}
function renderSkins(){$('skinList').innerHTML=SKINS.map(s=>{const owned=s.id==='classic'||localStorage.getItem('owned_'+s.id)==='1',equipped=currentSkin.id===s.id;return `<div class="skin ${equipped?'equipped':''} ${owned?'':'locked'}"><img src="${s.file}" alt="${s.name}"><strong>${s.name}</strong><small>🧲 +${s.attract}% khách · 🛡️ Độ bền ${s.durability}%</small><small>${s.cost===0?'Miễn phí':s.cost+' xu'}</small><button onclick="buySkin('${s.id}')">${equipped?'✓ Đang dùng':owned?'Trang bị':s.cost+' xu'}</button></div>`}).join('')}
function buySkin(id){const s=SKINS.find(x=>x.id===id),owned=id==='classic'||localStorage.getItem('owned_'+id)==='1';if(!owned){if(money<s.cost){toast('Chưa đủ tiền mua skin.');return}money-=s.cost;localStorage.setItem('owned_'+id,'1');log('🪟 Mua tủ '+s.name+' với '+s.cost+' xu.')}currentSkin=s;$('cabinet').src=s.file;$('cabinetName').textContent='Tủ bánh • '+s.name;$('attract').textContent=s.attract;$('durability').textContent=s.durability;renderSkins();moneyText();toast('Tủ bánh đã đổi skin ✨')}
function startGame(){const n=$('shopInput').value.trim();if(n)shopName=n;applyTheme(theme);ensureAudio();startMusic();$('shopTitle').textContent=shopName;$('start').style.display='none';$('setup').style.display='flex';updateStarterCost();$('starterQty').focus()}
function updateStarterCost(){const qty=Math.max(1,Math.min(30,Math.floor(Number($('starterQty').value)||1)));$('starterQty').value=qty;const total=qty*8;$('starterCost').textContent='Chi phí: '+total+' xu · Còn lại: '+(300-total)+' xu'}
function confirmStarterStock(){const qty=Math.max(1,Math.min(30,Math.floor(Number($('starterQty').value)||0)));const total=qty*8;if(total>300){toast('Số lượng bánh su kem vượt quá 300 xu.');return}money=300-total;batches=Object.fromEntries(CAKES.map(c=>[c.id,[]]));batches['su-kem']=[{qty,bornDay:1}];shelf=Object.fromEntries(CAKES.map(c=>[c.id,c.id==='su-kem']));syncStock();$('setup').style.display='none';moneyText();renderCakes();log('📦 Nhập lô khởi đầu: '+qty+' Bánh su kem, vốn '+total+' xu.');openShop()}
function updateNextDayButton(){const b=$('nextDayBtn');if(b){b.disabled=shopOpen;b.style.opacity=shopOpen?.55:1}}
function closeDaySummary(){$('end').style.display='none';$('eventActions').style.display='none';$('dayActions').style.display='block';switchTab('restock');renderRestockChoices();renderCakes();renderReviews();renderAnalytics();updateNextDayButton();}
function openShop(){syncStock();shopOpen=true;running=true;customerForecastTomorrow=forecastCustomers(day+1);$('end').style.display='none';$('loseActions').style.display='none';$('dayActions').style.display='block';$('endTitle').textContent='Hết ngày!';gameMinutes=8*60+30;arrivalWait=2+Math.random()*5;cabinetEventTimer=30;cabinetEventBusy=false;order=[];queue=[];orderSeconds=30;$('customer').textContent='Đang chờ khách...';$('bubble').textContent='Khách sẽ ghé tiệm theo từng khung giờ. Chuẩn bị bánh nhé!';$('order').innerHTML='';$('orderTime').textContent='30';renderQueue();renderCakes();lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));log('🚪 Ngày '+day+': '+shopName+' mở cửa lúc 08:30.');updateNextDayButton()}
$('starterQty')?.addEventListener('input',updateStarterCost)
function closeShop(){if(!shopOpen)return;shopOpen=false;running=false;loopToken++;order=[];queue=[];renderQueue();renderCakes();updateNextDayButton();showDayEnd()}
function showDayEnd(){ if(!chargeFixedCosts())return; $('endIcon').textContent=earlyClosedDay?'⚠️':'🌙';$('endTitle').textContent=earlyClosedDay?'Tiệm đóng cửa sớm':'Tiệm đã đóng cửa';$('summary').innerHTML=(earlyClosedDay?'⚠️ <b>Tiệm đã bán hết toàn bộ bánh nên phải đóng cửa sớm.</b><br>Danh tiếng bị trừ <b>0,3 sao</b> vì khách không thể tiếp tục mua hàng.<br><br>':'Ngày '+day+' kết thúc!<br><br>')+'<b>'+shopName+'</b> đã phục vụ <b>'+dayServed+'</b> khách, bán <b>'+sold+'</b> chiếc bánh và hiện có <b>'+Math.floor(money)+' xu</b>.<br>Danh tiếng: <b>'+rating.toFixed(1)+' sao ⭐</b>.<br>📅 Dự kiến ngày mai có khoảng <b>~'+customerForecastTomorrow+' khách</b>.<br><br>Kiểm tra bánh sắp hết hạn và dùng bảng doanh thu để tham khảo lượng nhập.';$('eventActions').style.display='none';$('dayActions').style.display='block';renderAnalytics();renderExpiryManagement();renderRestockChoices();$('end').style.display='flex';if(money<=0)lose('💸 Phá sản!')}
function nextDay(){if(shopOpen){toast('☀️ Tiệm đang mở. Hãy đóng cửa trước khi sang ngày mới.');return}day++;dayServed=0;earlyClosedDay=false;eventShownToday=false;customerForecastTomorrow=forecastCustomers(day+1);moneyText();syncStock();if(money<=0){lose('💸 Phá sản!');return}openShop();triggerDayEvents();toast('🌅 Ngày '+day+' bắt đầu!')}
function renderExpiryManagement(){const rows=[];for(const c of CAKES){const qty=(batches[c.id]||[]).filter(b=>b.bornDay+3===day+1).reduce((n,b)=>n+b.qty,0);if(qty)rows.push(`<div class="expiry-row"><span><b>${c.name}</b><br><small>⏳ ${qty} chiếc hết hạn ngày mai</small></span><span><button class="secondary" onclick="discardSoon('${c.id}')">🗑️ Bỏ bánh</button><button onclick="keepSoon('${c.id}')">📦 Giữ bán</button></span></div>`)}if($('expiryManagementRestock'))$('expiryManagementRestock').innerHTML=rows.length?`<div class="expiry-list">${rows.join('')}</div>`:'<p class="muted">✨ Không có bánh nào hết hạn vào ngày mai.</p>';if($('expiryManagement'))$('expiryManagement').innerHTML=rows.length?`<h3>⏳ Bánh sắp hết hạn</h3><p class="muted">Bánh quá 3 ngày sẽ hết hạn. Giữ lại thì vẫn có thể bán, nhưng mỗi chiếc hết hạn bán ra sẽ bị -0,5 sao và nhận bình luận tiêu cực.</p><div class="expiry-list">${rows.join('')}</div>`:'<p class="muted">✨ Không có bánh nào hết hạn vào ngày mai.</p>';renderShelfManager();renderRestockChoices()}
function discardSoon(id){const arr=batches[id]||[];let removed=0;batches[id]=arr.filter(b=>{if(b.bornDay+3===day+1){removed+=b.qty;return false}return true});syncStock();renderCakes();renderExpiryManagement();renderRestockChoices();log(`🗑️ Đã bỏ ${removed} ${cakeById(id).name} sắp hết hạn.`);toast(`Đã bỏ ${removed} bánh sắp hết hạn.`)}
function keepSoon(id){const c=cakeById(id);if(!confirm(`⚠️ CẢNH BÁO\n\n${c.name} sẽ hết hạn vào ngày mai. Nếu giữ lại, bánh hết hạn bán ra sẽ bị -0,5 sao và nhận đánh giá xấu.\n\nBạn vẫn muốn giữ lại không?`))return;toast(`⚠️ Đã giữ ${c.name}. Hãy ưu tiên bán trước khi hết hạn!`);log(`⚠️ Người chơi cố giữ ${c.name} sắp hết hạn sau khi đã xem cảnh báo.`);const rows=document.querySelectorAll('#expiryManagement .expiry-row');rows.forEach(r=>{if(r.textContent.includes(cakeById(id).name)){const btns=r.querySelectorAll('button');btns.forEach(b=>b.disabled=true);r.style.opacity='.6'}})}
function renderAnalytics(){
 const box=$('analyticsBox');if(!box)return;const sums=revenueSummary();
 const render=(label,rows)=>{const total=rows.reduce((n,r)=>n+r.revenue,0);const top=rows[0];return `<div style="margin-top:8px"><b>${label}</b> · ${total} xu</div>`+(top?`<div class="muted">🏆 Best seller: <b>${top.name}</b> · ${top.qty} chiếc · ${top.revenue} xu</div>`:'<div class="muted">Chưa có dữ liệu bán hàng.</div>')+rows.slice(0,5).map(r=>`<div style="display:flex;justify-content:space-between;font-size:12px"><span>${r.name}</span><span>${r.qty} chiếc · ${r.revenue} xu</span></div>`).join('')};
 const html='<b>📈 Doanh thu & Best Seller</b>'+render('Hôm nay',sums.day)+render('7 ngày gần nhất',sums.week)+render('30 ngày gần nhất',sums.month);box.innerHTML=html;if($('analyticsPage'))$('analyticsPage').innerHTML=html;
}
function renderRestockChoices(){
 if(shopOpen)return;
 const rows=CAKES.map(c=>!isCakeUnlocked(c)
  ?`<div class="restock-row locked-row"><span><b>${c.name}</b><br><small>🔒 Mở khóa vào <b>ngày ${c.unlockDay}</b> · Chưa thể nhập hàng</small></span><label class="locked-input">🔒</label></div>`
  :`<div class="restock-row"><span><b>${c.name}</b><br><small>Vốn ${c.cost} xu/chiếc · còn ${stock[c.id]} · bán ${c.price} xu</small></span><label>Nhập <input type="number" min="0" max="99" value="0" id="buy-${c.id}"></label></div>`).join('');
 $('restockChoices').innerHTML=`<h3>📦 Nhập hàng theo nhu cầu</h3><p class="muted">📅 Dự kiến ngày mai: <b>~${customerForecastTomorrow} khách</b>. Mỗi loại bánh mở khóa theo <b>ngày cố định</b>. Chỉ bánh đã mở khóa mới có thể nhập và bán. Số tiền dự kiến: <b id="restockTotal">0 xu</b>.</p><div class="unlock-roadmap">${CAKES.map(c=>`<span class="${isCakeUnlocked(c)?'unlocked':''}">${isCakeUnlocked(c)?'✓':'🔒'} ${c.name}: ngày ${c.unlockDay}</span>`).join('')}</div><div class="restock-list">${rows}</div><button class="secondary" onclick="restockSelected()">📦 Nhập các loại đã chọn</button><div class="box" style="margin-top:12px"><b>🍰 Quản lý bánh trên kệ</b><div id="shelfManager"></div></div>`;
 CAKES.filter(isCakeUnlocked).forEach(c=>{const el=$('buy-'+c.id);if(el)el.addEventListener('input',updateRestockTotal)});
 updateRestockTotal();
}
function updateRestockTotal(){let total=0;for(const c of CAKES)if(isCakeUnlocked(c))total+=c.cost*Math.max(0,Math.min(99,Math.floor(Number($('buy-'+c.id)?.value||0))));const el=$('restockTotal');if(el)el.textContent=total+' xu'}
function restockSelected(){
 if(shopOpen){toast('🔒 Hãy đóng cửa tiệm trước khi nhập hàng!');return}
 let total=0,plan={};
 for(const c of CAKES){const qty=isCakeUnlocked(c)?Math.max(0,Math.min(99,Math.floor(Number($('buy-'+c.id)?.value||0)))):0;plan[c.id]=qty;total+=qty*c.cost}
 if(!Object.values(plan).some(q=>q>0)){toast('Hãy chọn một loại bánh đã mở khóa để nhập.');return}
 if(money<total){toast(`Không đủ vốn! Cần ${total} xu, bạn có ${Math.floor(money)} xu.`);return}
 money-=total;for(const c of CAKES)if(plan[c.id]>0){batches[c.id].push({qty:plan[c.id],bornDay:day});shelf[c.id]=true;}
 syncStock();renderCakes();moneyText();log(`📦 Nhập hàng chọn lọc, tổng vốn ${total} xu.`);renderRestockChoices();toast(`Đã nhập hàng với ${total} xu.`);if(money<=0)lose('💸 Phá sản!')}
function newCustomer(){
 const available=CAKES.filter(c=>isCakeUnlocked(c)&&(stock[c.id]||0)>0&&shelf[c.id]);
 const pool=available.length?available:CAKES.filter(isCakeUnlocked);
 const type=pickCustomerType();
 const count=type==='vip'?Math.min(pool.length,2+Math.floor(Math.random()*2)):Math.min(pool.length,Math.random()<.7?1:2);
 const chosen=[];while(chosen.length<count){const id=pool[Math.floor(Math.random()*pool.length)].id;if(!chosen.includes(id))chosen.push(id)}
 const person=people[Math.floor(Math.random()*people.length)];
 const items=chosen.map(id=>({id,qty:type==='vip'?2+Math.floor(Math.random()*3):1+(Math.random()<.2?1:0),done:0}));
 return {person, type, items, patience:type==='vip'?35:30,maxPatience:type==='vip'?35:30};
}
function spawnCustomer(playBell=true){if(!shopOpen)return;if(!CAKES.some(c=>isCakeUnlocked(c)&&(stock[c.id]||0)>0&&shelf[c.id]))return;queue.push(newCustomer());if(playBell){ensureAudio();doorChime()}if(!order.length)takeNextCustomer();renderQueue()}
function takeNextCustomer(){if(!shopOpen||order.length||!queue.length)return;const customer=queue.shift();order=customer.items;orderExpired=false;orderSeconds=customer.patience;maxOrderSeconds=customer.maxPatience;window.currentCustomerType=customer.type;$('customer').textContent=customer.person+' '+CUSTOMER_TYPES[customer.type].icon+' đang gọi món';$('bubble').textContent=(customer.type==='vip'?'👑 VIP: Tôi lấy ':'Cho tôi ')+order.map(o=>o.qty+' '+cakeById(o.id).name).join(' và ')+' nhé!';renderOrder();renderQueue()}
function renderQueue(){$('queue').innerHTML=`<span>🧍 Hàng chờ: ${queue.length} khách</span>`+queue.slice(0,4).map((c,i)=>`<span>${i+1}. ${c.person} · ⏳ ${Math.ceil(c.patience)}s</span>`).join('')}
function renderOrder(){$('order').innerHTML=order.map(o=>`<div class="mini ${o.done>=o.qty?'ok':''}">${o.done>=o.qty?'✓':'○'} ${cakeById(o.id).name} ${o.done}/${o.qty}</div>`).join('')}
function addReview(good,person,customMsg){const msg=customMsg||((good?commentsGood:commentsBad)[Math.floor(Math.random()*(good?commentsGood:commentsBad).length)]);reviewData.unshift({id:Date.now()+Math.random(),good,person,msg,reply:''});reviewCount++;renderReviews();}
function renderReviews(){const html=reviewData.slice(0,20).map(r=>`<div class="review-card"><b>${r.good?'⭐️⭐️⭐️⭐️⭐️':'⭐️⭐️⭐️'} ${r.person}</b><br><span>${r.msg}</span>${r.reply?`<div class="review-reply">🏪 ${r.reply}</div>`:''}<button class="secondary" style="margin-top:6px" onclick="replyToReview('${r.id}')">💬 ${r.reply?'Sửa trả lời':'Trả lời'}</button></div>`).join('')||'<small>Chưa có đánh giá nào.</small>';if($('reviews'))$('reviews').innerHTML=html;if($('reviewsPage'))$('reviewsPage').innerHTML=html;}
function replyToReview(id){const r=reviewData.find(x=>String(x.id)===String(id));if(!r)return;const reply=prompt('Nhập câu trả lời cho khách hàng:',r.reply||'');if(reply===null)return;r.reply=reply.trim().slice(0,180);renderReviews();saveGame(false);toast(r.reply?'💬 Đã trả lời khách hàng.':'🗑️ Đã xóa câu trả lời.');}
function clearCurrentCustomer(){order=[];window.currentCustomerType=null;apologyPending=false;apologyDeadline=0;$('apologyActions').style.display='none';$('customer').textContent='Khách tiếp theo';$('bubble').textContent='Phục vụ nhanh và chính xác để giữ danh tiếng nhé!';renderOrder();renderQueue();}
function apologizeCustomer(){if(!apologyPending)return;const type=apologyCustomerType,name=apologyCustomerName;apologyPending=false;apologyDeadline=0;$('apologyActions').style.display='none';addReview(type!=='hard',name,type==='easy'?typeMessages.easy:type==='hard'?'Hết bánh nhưng tiệm đã chủ động xin lỗi.':'VIP nhận lời xin lỗi vì món đã hết.');toast(type==='easy'?'🙂 Không sao, ai cũng mắc sai lầm mà.':'🙏 Đã xin lỗi khách hàng — không bị trừ sao.');clearCurrentCustomer();takeNextCustomer();}
function serve(id){
 if(!shopOpen||!running)return;
 const cake=cakeById(id);if(!cake||!isCakeUnlocked(cake)){toast('🔒 '+(cake?cake.name:'Loại bánh này')+' chưa mở khóa.');return;}
 if(!order.length){toast('Chưa có khách gọi món, chờ một chút nhé!');return;}
 const currentType=window.currentCustomerType||'easy';
 const customerName=$('customer').textContent.replace(/ đang gọi món.*/,''), type=CUSTOMER_TYPES[currentType];
 const item=order.find(o=>o.id===id&&o.done<o.qty);
 if(!item){
   combo=0;goodSinceReview=0;orderSeconds=Math.max(0,orderSeconds-5);$('orderTime').textContent=Math.ceil(orderSeconds);
   toast('Lấy sai bánh! -5 giây kiên nhẫn ⏱️');
   if(currentType==='easy'){addReview(true,customerName,typeMessages.easy);toast('🙂 Không sao, ai cũng mắc sai lầm mà.');}
   else if(currentType==='hard'){addReview(false,customerName,typeMessages.hard);setRating(-.25,'Khách khó tính không hài lòng vì lấy sai bánh');missed++;clearCurrentCustomer();toast('😤 Thế mà cũng làm sai hừ! Khách bỏ về.');}
   else {addReview(true,customerName,'Khách VIP thông cảm vì nhầm bánh, nhưng mong tiệm chú ý hơn nhé.');setRating(-.05,'Khách VIP thông cảm vì nhầm bánh');}
   moneyText();return;
 }
 if(stock[id]<=0){
   orderSeconds=Math.max(0,orderSeconds-5);$('orderTime').textContent=Math.ceil(orderSeconds);
   apologyPending=true;apologyDeadline=5;apologyCustomerName=customerName;apologyCustomerType=currentType;$('apologyActions').style.display='block';$('bubble').textContent='🙏 Món này vừa hết. Hãy bấm “Xin lỗi khách” trong 5 giây để giữ đánh giá!';toast('⚠️ Hết bánh! Xin lỗi khách trong 5 giây.');
   moneyText();return;
 }
 const lots=batches[id]||[];lots.sort((a,b)=>a.bornDay-b.bornDay);const lot=lots.find(b=>b.qty>0);if(!lot){toast('⚠️ Hết bánh! Xin lỗi khách hàng nhé.');return;}
 const isExpired=day>=lot.bornDay+3;lot.qty--;batches[id]=lots.filter(b=>b.qty>0);syncStock();item.done++;sold++;combo++;money+=cake.profit;
 recordSale(cake,1,cake.price);renderAnalytics();
 if(isExpired){orderExpired=true;setRating(-.5,'Bán '+cake.name+' đã hết hạn');log('⚠️ Bán bánh hết hạn: '+cake.name+' (-0,5 sao).')}
 renderCakes();renderOrder();moneyText();
 if(money<=0){lose('💸 Phá sản!');return}
 if(order.every(o=>o.done>=o.qty)){
   const customerName2=$('customer').textContent.replace(/ đang gọi món.*/,''), ct=CUSTOMER_TYPES[currentType];
   let bonus=6+Math.min(combo,10);
   if(currentType==='vip'){const vipBonus=20+Math.floor(Math.random()*21);bonus+=vipBonus;money+=vipBonus;setRating(.2,'Khách VIP thưởng thêm '+vipBonus+' xu');log('👑 Khách VIP mua nhiều và thưởng thêm '+vipBonus+' xu!');}
   money+=bonus;served++;dayServed++;
   if(orderExpired){addReview(false,customerName2,'Bánh đã hết hạn, mình không hài lòng!');goodSinceReview=0}
   else if(currentType==='hard'){addReview(true,customerName2,'Đơn hàng đúng món nhưng mình vẫn hơi khó tính nhé.');setRating(.05,'Khách khó tính mua hàng đúng món');}
   else {goodSinceReview++;addReview(true,customerName2,currentType==='vip'?'Dịch vụ ổn, tôi sẽ quay lại!':undefined);setRating(currentType==='vip'?.2:.1,currentType==='vip'?'Khách VIP hài lòng':'Khách hài lòng với đơn hàng');if(goodSinceReview>=3){goodSinceReview=0;setRating(.1,'3 khách liên tiếp được phục vụ tốt')}}
   if(served%5===0){level++;log('🌟 Lên cấp '+level+'.')}
   clearCurrentCustomer();moneyText();renderQueue();if(shopOpen)takeNextCustomer();toast(orderExpired?'Đơn xong nhưng khách không hài lòng 😕':currentType==='vip'?'👑 VIP đã mua nhiều và thưởng thêm!':'Đơn xong! Khách hài lòng 🎉');
   if(!CAKES.some(c=>(stock[c.id]||0)>0)){closeEarlyBecauseSoldOut();return}
 }
}
function cabinetFailureChance(){return 0.35*Math.max(0.01,1-(currentSkin.durability/100));}
function spoilCabinetCakes(){syncStock();let total=0,spoiled=0;for(const c of CAKES){const qty=stock[c.id]||0;if(!qty)continue;const bad=Math.min(qty,Math.ceil(qty*0.6));let left=bad;const lots=(batches[c.id]||[]).sort((a,b)=>a.bornDay-b.bornDay);for(const lot of lots){if(left<=0)break;const take=Math.min(lot.qty,left);lot.qty-=take;left-=take;spoiled+=take;}batches[c.id]=lots.filter(b=>b.qty>0);total+=qty}syncStock();if(spoiled){log('⚡ Tủ mất điện quá lâu: '+spoiled+' chiếc bánh bị hỏng.');addReview(false,'Khách bị ảnh hưởng bởi sự cố','Tủ mất điện làm bánh không còn tươi, mình hơi thất vọng.');setRating(-.2,'Bánh bị hỏng do tủ mất điện');toast('⚡ Tủ mất điện! '+spoiled+' bánh đã bị hỏng.');}renderCakes();}
function startCabinetFailure(){if(!shopOpen||cabinetEventBusy||!CAKES.some(c=>(stock[c.id]||0)>0))return;cabinetEventBusy=true;running=false;loopToken++;repairTimer=20;repairSelected=null;repairPairsDone=0;const colors=['🔴 Đỏ','🔵 Xanh dương','🟢 Xanh lá'];repairWires=[...colors,...colors].sort(()=>Math.random()-.5).map((color,i)=>({color,id:i,done:false}));$('repairOverlay').style.display='flex';renderRepairWires();clearInterval(repairInterval);repairInterval=setInterval(()=>{repairTimer--;if($('repairTimer'))$('repairTimer').textContent=repairTimer;if(repairTimer<=0){clearInterval(repairInterval);repairInterval=null;$('repairOverlay').style.display='none';cabinetEventBusy=false;spoilCabinetCakes();if(shopOpen){running=true;lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));}}},1000);log('⚡ Tủ bánh bị mất điện! Cần sửa trong 20 giây.');toast('⚡ Tủ mất điện! Nhanh tay nối dây!');}
function renderRepairWires(){const grid=$('repairGrid');grid.innerHTML=repairWires.map((w,i)=>`<button class="wire ${w.done?'done':''}" onclick="selectRepairWire(${i})">${w.color}<br><small>Đầu dây ${i+1}</small></button>`).join('');}
function selectRepairWire(i){const w=repairWires[i];if(!w||w.done)return;if(repairSelected===null){repairSelected=i;document.querySelectorAll('#repairGrid .wire')[i]?.classList.add('selected');return}if(repairSelected===i)return;const a=repairWires[repairSelected];if(a.color===w.color){a.done=true;w.done=true;repairPairsDone++;repairSelected=null;renderRepairWires();if(repairPairsDone===3)finishCabinetRepair();}else{toast('❌ Sai màu! Hãy nối hai đầu cùng màu.');repairSelected=null;renderRepairWires();}}
function finishCabinetRepair(){clearInterval(repairInterval);repairInterval=null;$('repairOverlay').style.display='none';cabinetEventBusy=false;log('🔧 Đã sửa tủ thành công trước khi bánh bị hỏng.');toast('🔧 Sửa tủ thành công! Bánh vẫn được bảo quản.');if(shopOpen){running=true;lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));}}
function processCabinetEvent(dt){if(!shopOpen||cabinetEventBusy)return;cabinetEventTimer-=dt;if(cabinetEventTimer<=0){cabinetEventTimer=30;if(Math.random()<cabinetFailureChance())startCabinetFailure();}}
function chargeFixedCosts(){if(day%30!==0||lastBillingDay===day)return true;lastBillingDay=day;const rent=4000,electric=1000,total=5000;if(money<total){log('🏠 Đến kỳ thanh toán: cần 5.000 xu nhưng chỉ có '+Math.floor(money)+' xu.');lose('💸 Không đủ tiền mặt bằng & điện');return false}money-=total;moneyText();log('🏠 Đã trả mặt bằng 4.000 xu + tiền điện 1.000 xu = 5.000 xu.');toast('🏠 Đã thanh toán 5.000 xu chi phí cố định.');return true;}
function showEvent(title,html,buttons){running=false;$('endIcon').textContent='🎲';$('endTitle').textContent=title;$('summary').innerHTML=html;$('dayActions').style.display='none';$('eventActions').innerHTML=buttons;$('eventActions').style.display='block';$('loseActions').style.display='none';$('end').style.display='flex';}
function triggerDayEvents(){
 if(day>=7 && day===7 && !eventShownToday){eventShownToday=true;showEvent('🥺 Một người ăn xin ghé tiệm','Một người ăn xin đứng trước cửa tiệm. Bạn có muốn cho họ một ít tiền không?','<button onclick="helpBeggar()">💰 Cho 50 xu</button><button class="secondary" onclick="skipBeggar()">🚪 Không cho</button>');return;}
 if(day===12 && pendingBeggarReward){pendingBeggarReward=false;showEvent('🎁 Lời báo đáp','Người ăn xin ngày trước quay lại và gửi bạn <b>500 xu</b> để báo đáp lòng tốt!','<button onclick="claimBeggarReward()">✨ Nhận 500 xu</button>');return;}
 if(day===15 && !eventShownToday){eventShownToday=true;showEvent('💐 Một món quà nhỏ','Một cậu bé bước vào tiệm, tặng bạn một bó hoa và nói:<br><br><b>“Bạn đã làm vất vả rồi, đừng cố sức quá nhé!”</b><br><br>🌷 Một khoảnh khắc ấm áp giữa những ngày bận rộn.','<button onclick="closeEvent()">💗 Cảm ơn em</button>');return;}
 if(day>=nextReviewerCheckDay){
   const scheduledDay=day;
   nextReviewerCheckDay=day+(Math.random()<0.5?3:4);
   if(day!==12 && day!==15 && Math.random()<0.30){showEvent('📣 Food Reviewer ghé tiệm','Một food reviewer nổi tiếng vừa ghé và đăng một bài review không tốt về quán. Bạn bị trừ <b>200 xu</b>.','<button onclick="acceptReviewerEvent()">😔 Đành chịu</button>');}
   else {log('📅 Hôm nay không có Food Reviewer. Lần kiểm tra tiếp theo sau 3–4 ngày.');}
 }
}
function helpBeggar(){if(money<50){toast('Bạn không đủ 50 xu để giúp.');return}money-=50;pendingBeggarReward=true;beggarAccepted=true;moneyText();log('🤲 Bạn đã giúp người ăn xin 50 xu.');closeEvent();toast('🤲 Bạn đã giúp một người.');}
function skipBeggar(){log('🚪 Bạn không cho tiền người ăn xin. Không có ảnh hưởng xấu.');closeEvent();}
function claimBeggarReward(){money+=500;moneyText();log('🎁 Người ăn xin báo đáp: +500 xu.');toast('🎁 +500 xu! Lòng tốt được đền đáp.');closeEvent();}
function acceptReviewerEvent(){money=Math.max(0,money-200);moneyText();log('📣 Food Reviewer review xấu: -200 xu.');toast('📣 Review xấu! -200 xu');if(money<=0){lose('💸 Phá sản!');return}closeEvent();}
function closeEvent(){ $('end').style.display='none';$('eventActions').style.display='none';$('eventActions').innerHTML='';$('dayActions').style.display='block';if(shopOpen){running=true;lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));renderCakes();renderQueue();}}
function gameClockText(){const h=Math.floor(gameMinutes/60),m=Math.floor(gameMinutes%60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
function lose(title){running=false;shopOpen=false;loopToken++;$('eventActions').style.display='none';$('dayActions').style.display='none';$('endIcon').textContent='💥';$('endTitle').textContent=title;const noCapital=(money<=0||/Phá sản|Không đủ tiền|không còn vốn/i.test(title));$('summary').innerHTML=noCapital?'Rất tiếc, bạn đã không còn vốn để tiếp tục.<br><br><b>'+shopName+'</b> đã bán '+sold+' chiếc bánh và hiện có <b>'+Math.floor(money)+' xu</b>.<br><br><span style="display:inline-block;background:#fff4df;border:1px solid #efd5a8;border-radius:12px;padding:9px 12px">💳 <b>Vay tiền — Coming soon</b><br><small>Tính năng vay vốn sẽ được cập nhật trong tương lai.</small></span>':'Danh tiếng tiệm còn <b>'+rating.toFixed(1)+' sao</b>. Dưới 2,5 sao là bị phốt!<br><br><b>'+shopName+'</b> đã bán '+sold+' chiếc bánh và có '+Math.floor(money)+' xu.<br><br>Đừng nản — bạn có thể nhập lại lô bánh khởi đầu và thử mở tiệm lại.';$('dayActions').style.display='none';$('loseActions').style.display='block';$('end').style.display='flex'}
function restartGame(){stopMusic();musicStep=0;revenueHistory=[];salesHistory=[];pendingBeggarReward=false;beggarAccepted=false;lastBillingDay=0;nextReviewerCheckDay=4;money=300;earlyClosedDay=false;level=1;combo=0;served=0;missed=0;sold=0;day=1;rating=3.5;batches=Object.fromEntries(CAKES.map(c=>[c.id,[]]));stock=Object.fromEntries(CAKES.map(c=>[c.id,0]));shelf=Object.fromEntries(CAKES.map(c=>[c.id,false]));reviewData=[];order=[];queue=[];goodSinceReview=0;dayServed=0;apologyPending=false;apologyDeadline=0;reviewCount=0;expiredHandledDay=0;orderExpired=false;$('reviews').innerHTML='<small>Chưa có đánh giá nào.</small>';$('log').innerHTML='';moneyText();setRating(0,'');$('end').style.display='none';$('loseActions').style.display='none';$('setup').style.display='flex';updateStarterCost();toast('🔄 Tiệm đã sẵn sàng để bắt đầu lại!')}
function closeEarlyBecauseSoldOut(){if(!shopOpen||earlyClosedDay)return;earlyClosedDay=true;shopOpen=false;running=false;loopToken++;updateNextDayButton();order=[];queue=[];goodSinceReview=0;setRating(-.3,'Bán hết toàn bộ bánh và phải đóng cửa sớm');addReview(false,'Khách cuối ngày','Tiệm bán hết bánh sớm nên mình không mua được nữa.');renderQueue();renderOrder();renderCakes();toast('⚠️ Đã bán hết bánh! Tiệm đóng cửa sớm (-0,3 sao).');showDayEnd()}
function finishDay(){if(!shopOpen)return;shopOpen=false;running=false;loopToken++;updateNextDayButton();order=[];queue=[];renderQueue();renderCakes();showDayEnd()}
function arrivalDelay(){const h=Math.floor(gameMinutes/60);let min=7,max=16;if(h>=7&&h<10){min=4;max=9}else if(h>=11&&h<14){min=3;max=7}else if(h>=16&&h<19){min=3;max=6}else if(h>=19&&h<21){min=5;max=10}const attraction=1+currentSkin.attract/100;return (min+Math.random()*(max-min))/attraction}
function loop(t,token){if(!running||token!==loopToken)return;const dt=Math.min((t-lastT)/1000,.25);lastT=t;gameMinutes+=dt*(14*60/240);if(gameMinutes>=22*60){gameMinutes=22*60;$('gameClock').textContent=gameClockText();finishDay();return}$('gameClock').textContent=gameClockText();processCabinetEvent(dt);if(apologyPending){apologyDeadline-=dt;if(apologyDeadline<=0){const missedType=apologyCustomerType;const missedName=apologyCustomerName;apologyPending=false;$('apologyActions').style.display='none';setRating(-.1,'Quên xin lỗi khách khi hết bánh');toast('⚠️ Bạn quên xin lỗi khách hàng (-0,1 sao).');log('⚠️ Quên bấm nút xin lỗi khi món đã hết.');if(missedType==='hard'){addReview(false,missedName,'Hết bánh mà còn không xin lỗi, hừ!');missed++;clearCurrentCustomer();takeNextCustomer();}}}if(cabinetEventBusy)return;arrivalWait-=dt;if(arrivalWait<=0){if(queue.length<5){ensureAudio();doorChime();setTimeout(()=>{if(shopOpen&&!cabinetEventBusy)spawnCustomer(false)},3000)}arrivalWait=arrivalDelay()}if(order.length){orderSeconds-=dt;$('orderTime').textContent=Math.ceil(Math.max(0,orderSeconds));$('bar').style.width=(Math.max(0,orderSeconds)/maxOrderSeconds*100)+'%';if(orderSeconds<=0){const name=$('customer').textContent.replace(/ [🙂😤👑] đang gọi món.*/,'');missed++;combo=0;goodSinceReview=0;addReview(false,name,CUSTOMER_TYPES[window.currentCustomerType]?.name+' bỏ đi vì hết kiên nhẫn.');setRating(window.currentCustomerType==='hard'?-0.3:-.2,'Khách bỏ đi vì hết kiên nhẫn');toast('Khách bỏ đi vì chờ lâu! 😬');clearCurrentCustomer();takeNextCustomer()}}if(!CAKES.some(c=>(stock[c.id]||0)>0)){closeEarlyBecauseSoldOut();return}queue.forEach(c=>c.patience=Math.max(0,c.patience-dt));const left=queue.filter(c=>c.patience>0);if(left.length<queue.length){const gone=queue.length-left.length;for(let i=0;i<gone;i++){addReview(false,'Khách rời hàng');setRating(-.1,'Khách trong hàng chờ bỏ đi')}queue=left}renderQueue();requestAnimationFrame(tt=>loop(tt,token))}

function applyTheme(name){theme=name||'cream';document.body.dataset.theme=theme;localStorage.setItem('theme',theme);document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===theme));}
function openSettings(){$('settingsOverlay').style.display='flex';$('renameInput').value=shopName;applyTheme(theme);}
function closeSettings(){$('settingsOverlay').style.display='none';}
function setTheme(name){applyTheme(name);toast('🎨 Đã đổi màu nền.');}
function renameShop(){const n=$('renameInput').value.trim();if(!n){toast('Tên tiệm không được để trống.');return}shopName=n.slice(0,24);$('shopTitle').textContent=shopName;log('✏️ Đã đổi tên tiệm thành '+shopName+'.');toast('✏️ Đổi tên tiệm thành công.');saveGame(false);}
function saveGame(show=true){const data={version:3,shopName,nextReviewerCheckDay,money,level,combo,served,missed,sold,day,rating,batches,stock,shelf,reviewData,expiredHandledDay,goodSinceReview,dayServed,reviewCount,revenueHistory,salesHistory,customerForecastTomorrow,pendingBeggarReward,beggarAccepted,lastBillingDay,currentSkinId:currentSkin.id,theme};localStorage.setItem('dreamBakerySave',JSON.stringify(data));if(show)toast('💾 Đã lưu game!');}
function loadGame(){try{const raw=localStorage.getItem('dreamBakerySave');if(!raw)return false;const d=JSON.parse(raw);if(!d||!d.version)return false;shopName=d.shopName||shopName;nextReviewerCheckDay=Number(d.nextReviewerCheckDay||4);money=Number(d.money??300);level=Number(d.level??1);combo=Number(d.combo??0);served=Number(d.served??0);missed=Number(d.missed??0);sold=Number(d.sold??0);day=Number(d.day??1);rating=Number(d.rating??3.5);batches=d.batches||batches;stock=d.stock||stock;shelf=d.shelf||Object.fromEntries(CAKES.map(c=>[c.id,(d.stock?.[c.id]||0)>0]));reviewData=d.reviewData||[];expiredHandledDay=Number(d.expiredHandledDay||0);goodSinceReview=Number(d.goodSinceReview||0);dayServed=Number(d.dayServed||0);reviewCount=Number(d.reviewCount||0);revenueHistory=d.revenueHistory||[];salesHistory=d.salesHistory||[];customerForecastTomorrow=Number(d.customerForecastTomorrow||40);pendingBeggarReward=!!d.pendingBeggarReward;beggarAccepted=!!d.beggarAccepted;lastBillingDay=Number(d.lastBillingDay||0);theme=d.theme||'brown';const savedSkin=SKINS.find(s=>s.id===d.currentSkinId);if(savedSkin)currentSkin=savedSkin;syncStock();applyTheme(theme);$('shopTitle').textContent=shopName;$('cabinet').src=currentSkin.file;$('cabinetName').textContent='Tủ bánh • '+currentSkin.name;$('attract').textContent=currentSkin.attract;$('durability').textContent=currentSkin.durability;moneyText();renderCakes();renderSkins();renderAnalytics();renderReviews();renderRestockChoices();updateNextDayButton();log('💾 Đã khôi phục dữ liệu đã lưu.');return true;}catch(e){console.warn('Save lỗi',e);return false;}}
function clearSave(){localStorage.removeItem('dreamBakerySave');toast('🗑️ Đã xóa bản lưu.');}
function toggleAccordion(btn){const item=btn.closest('.accordion');document.querySelectorAll('.side .accordion.open').forEach(a=>{if(a!==item)a.classList.remove('open')});item.classList.toggle('open')}
function toggleReputationPanel(){const side=$('reputationSide');side.classList.toggle('reputation-expanded');if(side.classList.contains('reputation-expanded'))side.scrollIntoView({behavior:'smooth',block:'nearest'})}
function switchTab(tab){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+tab));if(tab==='restock'){renderRestockChoices();renderShelfManager();renderExpiryManagement();}if(tab==='cabinet')renderSkins();}

$('attract').textContent='0';applyTheme(theme);renderCakes();renderTable();renderSkins();moneyText();renderAnalytics();renderReviews();renderRestockChoices();setRating(0,'');$('dayActions').style.display='block';updateNextDayButton();
