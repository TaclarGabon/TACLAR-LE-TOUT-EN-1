/* Personal planning: Firebase-authenticated, Firestore-backed. */
(function(){
  const root=document.getElementById("elitePersonal"),demo=document.getElementById("planningDemo"),transport=document.getElementById("eliteTransport"),transportDemo=document.getElementById("transportDemo");
  const weekdays=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
  const txt=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
  let record=null,table=null,weekly=false;
  function transportView(personal,message){transport.classList.toggle("hidden",!personal);transportDemo.classList.toggle("hidden",personal);if(personal){transport.textContent=message||"Transport : aucune affectation enregistrée pour cet élève. Les horaires et événements de montée/descente seront affichés après enregistrement par l’administration.";}}
  let liveEvents=[],unsubscribeLive=null;
  function liveCard(){
    const names=["Montée à Okala","Arrivée à l’école","Récupération à l’école","Dépose à Okala"];
    const body=liveEvents.length?liveEvents.map(e=>{
      const comparison=(e.step===1||e.step===2)&&e.time?punctuality(e.step,e.time):"";
      return '<p style="margin:12px 0">✅ '+txt(names[e.step]||"Étape")+' : <strong>'+txt(e.time||"heure en attente")+'</strong>'+(comparison?'<span style="display:block;font-size:13px;font-weight:700;color:#246b48;margin-top:3px">'+txt(comparison)+' (test)</span>':'')+'</p>';
    }).join(""):'<p>Aucune confirmation Firebase aujourd’hui.</p>';
    return '<div style="background:#eef7f1;border-radius:12px;padding:14px;margin:12px 0"><strong>Confirmations Firebase — test</strong><p style="font-size:12px">Heures des confirmations transmises par le compte administrateur de test.</p>'+body+'</div>';
  }
  let demoStep=0;
  let demoTimes=[null,null,null,null];
  const routeUrl="https://www.google.com/maps/dir/?api=1&origin=March%C3%A9%20Okala%2C%20Libreville%2C%20Gabon&destination=ELITE%20International%20School%20of%20Gabon%2C%20La%20Sabli%C3%A8re%2C%20Libreville%2C%20Gabon&travelmode=driving";
  const courseDay=()=>{const w=new Intl.DateTimeFormat("fr-FR",{timeZone:"Africa/Libreville",weekday:"long"}).format(new Date());return w.charAt(0).toUpperCase()+w.slice(1)};
  const minutes=t=>{const p=String(t||"").replace("h",":").split(":");return p.length===2 && p.every(x=>x!=="" && Number.isFinite(Number(x)))?Number(p[0])*60+Number(p[1]):null};
  function courseBounds(){const courses=table&&table.days&&table.days[courseDay()];if(!Array.isArray(courses))return null;const valid=courses.filter(x=>!/(pause|repas)/i.test(x.subject||""));if(!valid.length)return null;return {start:valid[0].start,end:valid[valid.length-1].end}};
  function punctuality(i,time){const measured=time||demoTimes[i];if((i!==1&&i!==2)||!measured)return "";const bounds=courseBounds();if(!bounds)return "Comparaison indisponible : pas de cours renseigné pour ce jour";const target=minutes(i===1?bounds.start:bounds.end);const observed=minutes(measured);if(target===null||observed===null)return "Horaires non comparables";const delta=observed-target;if(i===1)return delta<0?"Arrivée en avance de "+(-delta)+" min":delta===0?"Arrivée à l’heure":"Arrivée en retard de "+delta+" min";const late=delta-30;return late<=0?"Récupération à l’heure":"Récupération en retard de "+late+" min";}
  const stages=[
    ["Matin","Montée dans le bus","🚌","Okala — derrière le marché"],
    ["Matin","Arrivée à l’école","🏫","Elite International — La Sablière"],
    ["Retour","Montée dans le bus","🚌","Elite International — La Sablière"],
    ["Retour","Arrivée au point de dépose","📍","Okala — derrière le marché"]
  ];
  function demoRow(stage,i){
    const e=liveEvents.find(x=>x.step===i),done=!!e,local=i<demoStep;
    const time=e?e.time:(local?demoTimes[i]:null);
    const comparison=(i===1||i===2)&&time?punctuality(i,time):"";
    return '<div class="lesson" style="align-items:center"><div><strong>'+stage[2]+' '+stage[1]+'</strong><p>'+txt(stage[3])+'</p>'+(comparison?'<p style="color:#28764f;font-size:13px;font-weight:700">'+txt(comparison)+(done?' (test Firebase)':' (simulation locale)')+'</p>':'')+'</div><div style="text-align:right;flex-shrink:0;font-size:13px;font-weight:700;color:'+(done?'#28764f':'#687987')+'">'+(done?'✓ Confirmé (test)':local?'✓ Simulation locale':'En attente')+(time?'<div style="margin-top:5px;font-size:15px">'+txt(time)+'</div>':'')+'</div></div>';
  }
  function showTransportSimulation(){
    if(!record)return;
    transport.classList.remove("hidden");transportDemo.classList.add("hidden");
    const status=demoStep===0?'En attente de montée':demoStep===1?'Trajet du matin en cours (simulation)':demoStep===2?'Arrivée à l’école confirmée (démo)':demoStep===3?'Trajet retour en cours (simulation)':'Retour terminé (simulation)';
    const accordionWasOpen=!!transport.querySelector("details[open]");
    transport.innerHTML='<h2>Transport de mon enfant</h2><p><strong>'+txt(record.name)+'</strong> · Elite International · 6e PEII</p>'+
      '<p style="background:#fff1b5;padding:12px;border-radius:10px;font-weight:700">MODE DÉMONSTRATION — aucun trajet ni position GPS réelle.</p>'+
      '<p><strong>Statut :</strong> '+txt(status)+'</p>'+
      '<div style="border:1px solid #d9e2e8;border-radius:14px;padding:15px;margin:12px 0;background:#f4f8fb"><strong>🗺️ Circuit de référence validé</strong><p style="margin:8px 0">Okala (point de prise en charge) → Elite International, La Sablière</p><p style="margin:8px 0;font-size:13px;color:#536476">Trajet témoin validé sur ta capture : 2,1 km · 5 min. Le lien utilise le marché d’Okala comme repère public, pas le point GPS privé ; le parcours peut donc différer.</p><a href="'+routeUrl+'" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:12px;background:#deedff;border-radius:9px;font-weight:700;color:#184e8a">Ouvrir Google Maps (repère public Okala) ↗</a></div>'+
      '<p style="font-size:13px;color:#526277">'+(courseBounds()?'Cours du '+txt(courseDay())+' : début '+txt(courseBounds().start)+' · fin '+txt(courseBounds().end)+' · récupération jusqu’à '+txt((()=>{let n=minutes(courseBounds().end)+30;return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")})()):'Horaire de cours indisponible pour ce jour')+'</p><h3>Trajet du matin</h3>'+stages.slice(0,2).map((s,i)=>demoRow(s,i)).join("")+
      '<h3>Trajet du retour</h3>'+stages.slice(2).map((s,i)=>demoRow(s,i+2)).join("")+
      '<details style="margin-top:15px"><summary style="font-weight:700;cursor:pointer">Simulation locale (facultatif)</summary><label style="display:block;margin:12px 0;font-size:14px;font-weight:600">Heure à simuler (Libreville) <input id="demoClock" type="time" style="display:block;width:100%;padding:12px;border-radius:10px;border:1px solid #d3dce3;font-size:16px" value="'+new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Libreville",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date())+'"></label><button id="nextDemo" class="action">'+(demoStep===4?'Recommencer la simulation':'Confirmer l’étape suivante (démo)')+'</button>'+
      '<p style="font-size:13px;color:#64748b">Chaque clic enregistre l’heure de démonstration au fuseau de Libreville uniquement sur cet écran. Les heures réelles seront transmises par le personnel autorisé et stockées en sécurité. Le bus ne peut pas être localisé avec ces seules confirmations.</p></details>';
    if(accordionWasOpen)transport.querySelector("details").open=true;
    document.getElementById("nextDemo").onclick=()=>{
      if(demoStep===4){demoStep=0;demoTimes=[null,null,null,null]}
      else {demoTimes[demoStep]=document.getElementById("demoClock").value;demoStep++}
      showTransportSimulation();
    };
  }
  function render(){
    if(!record)return;
    const items=table&&table.days||{},now=new Intl.DateTimeFormat("fr-FR",{weekday:"long",timeZone:"Africa/Libreville"}).format(new Date()),today=now.charAt(0).toUpperCase()+now.slice(1);
    const days=weekly?weekdays:[today];
    root.innerHTML='<h2>Planning de mon enfant</h2><p><strong>'+txt(record.name)+'</strong> · '+txt(record.classId==="elite-6e-peii"?"6e · PEII":record.classId==="ntchorere-1ere-acc"?"1ère ACC":record.classId)+'</p><p>'+txt(record.schoolId==="college-capitaine-ntchorere"?"Collège Capitaine Ntchoréré · Démonstration · 2026–2027":"Elite International · 2026–2027")+'</p><div class="tabs"><button id="eliteToday" class="'+(!weekly?"active":"")+'">Aujourd’hui</button><button id="eliteWeek" class="'+(weekly?"active":"")+'">Ma semaine</button></div>'+(!table?'<p>Planning en cours d’autorisation dans Firebase.</p>':days.map(day=>'<h3>'+txt(day)+'</h3>'+(items[day]||[]).map(row=>'<div class="lesson"><div><strong>'+txt(row.subject)+'</strong></div><time>'+txt(row.start)+'–'+txt(row.end)+'</time></div>').join("")||'<p>Pas de cours renseigné.</p>').join(""));
    document.getElementById("eliteToday").onclick=()=>{weekly=false;render()};
    document.getElementById("eliteWeek").onclick=()=>{weekly=true;render()};
  }
  function setPage(personal,msg){root.classList.toggle("hidden",!personal);demo.classList.toggle("hidden",personal);if(personal&&msg)root.textContent=msg;}
  async function refresh(user){
    if(unsubscribeLive){unsubscribeLive();unsubscribeLive=null}liveEvents=[];
    record=null;table=null;weekly=false;
    if(!user){setPage(false);transportView(false);return}
    if(typeof firebase==="undefined"||!firebase.firestore)return;
    const db=firebase.firestore();
    try{
      const parent=await db.collection("parents").doc(user.uid).get();
      if(!parent.exists){setPage(true,"Aucun enfant associé à ce compte. La démonstration historique est accessible uniquement depuis l’administration.");transportView(true,"Transport non configuré pour ce compte.");return}
      setPage(true,"Chargement de l’emploi du temps personnel…");transportView(true,"Recherche de l’affectation transport…");
      const students=await db.collection("students").where("parentUid","==",user.uid).limit(10).get();
      if(students.empty){setPage(true,"Aucun élève n’est encore associé à ce compte.");transportView(true,"Transport non configuré pour ce compte.");return}
      const eligible=students.docs.find(d=>["elite-6e-peii","ntchorere-1ere-acc"].includes(d.data().classId));
      if(!eligible){setPage(true,"Aucun planning disponible pour les classes associées à ce compte.");transportView(true,"Transport non configuré.");return}
      record=eligible.data();const ntchorere=record.classId==="ntchorere-1ere-acc";if(ntchorere){transportView(true,"Transport non configuré — dossier de démonstration Ntchoréré.");}else{showTransportSimulation();}
      if(!ntchorere){
      const dayParts={};new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Libreville",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).forEach(x=>dayParts[x.type]=x.value);
      const dayId="gulian-fity-"+dayParts.year+"-"+dayParts.month+"-"+dayParts.day;
      unsubscribeLive=db.collection("transportDemoDays").doc(dayId).collection("events").onSnapshot(snapshot=>{liveEvents=snapshot.docs.map(d=>{const x=d.data(),t=x.recordedAt&&x.recordedAt.toDate?x.recordedAt.toDate():null;return {step:x.step,time:t?new Intl.DateTimeFormat("fr-FR",{timeZone:"Africa/Libreville",hour:"2-digit",minute:"2-digit",hour12:false}).format(t):"en attente"}}).sort((a,b)=>a.step-b.step);showTransportSimulation()},error=>{liveEvents=[];showTransportSimulation()});
      }
      try{
        const doc=await db.collection("timetables").doc(ntchorere?"ntchorere-1ere-acc-2026-2027":"elite-6e-peii-2026-2027").get();
        if(doc.exists)table=doc.data();
      }catch(error){table=null}
      render();if(!ntchorere)showTransportSimulation();
    }catch(error){setPage(true,"Impossible de charger ce dossier. Vérifie les autorisations Firestore.");}
  }
  firebase.auth().onAuthStateChanged(refresh);
})();
