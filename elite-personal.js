/* Personal planning: Firebase-authenticated, Firestore-backed. */
(function(){
  const root=document.getElementById("elitePersonal"),demo=document.getElementById("planningDemo"),transport=document.getElementById("eliteTransport"),transportDemo=document.getElementById("transportDemo");
  const weekdays=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
  const txt=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
  let record=null,table=null,weekly=false;
  function transportView(personal,message){transport.classList.toggle("hidden",!personal);transportDemo.classList.toggle("hidden",personal);if(personal){transport.textContent=message||"Transport : aucune affectation enregistrée pour cet élève. Les horaires et événements de montée/descente seront affichés après enregistrement par l’administration.";}}
  let demoStep=0;
  let demoTimes=[null,null,null,null];
  const routeUrl="https://www.google.com/maps/dir/?api=1&origin=March%C3%A9%20Okala%2C%20Libreville%2C%20Gabon&destination=ELITE%20International%20School%20of%20Gabon%2C%20La%20Sabli%C3%A8re%2C%20Libreville%2C%20Gabon&travelmode=driving";
  const stages=[
    ["Matin","Montée dans le bus","🚌","Okala — derrière le marché"],
    ["Matin","Arrivée à l’école","🏫","Elite International — La Sablière"],
    ["Retour","Montée dans le bus","🚌","Elite International — La Sablière"],
    ["Retour","Arrivée au point de dépose","📍","Okala — derrière le marché"]
  ];
  function demoRow(s,i){
    const done=i<demoStep;
    return '<div class="lesson" style="align-items:center"><div><strong>'+s[2]+' '+s[1]+'</strong><p>'+txt(s[3])+'</p></div><div style="text-align:right;flex-shrink:0;font-size:13px;font-weight:700;color:'+(done?'#28764f':'#687987')+'">'+(done?'✓ Démo':'En attente')+(done?'<div style="margin-top:5px;font-size:15px">'+txt(demoTimes[i])+'</div>':'')+'</div></div>';
  }
  function showTransportSimulation(){
    if(!record)return;
    transport.classList.remove("hidden");transportDemo.classList.add("hidden");
    const status=demoStep===0?'En attente de montée':demoStep===1?'Trajet du matin en cours (simulation)':demoStep===2?'Arrivée à l’école confirmée (démo)':demoStep===3?'Trajet retour en cours (simulation)':'Retour terminé (simulation)';
    transport.innerHTML='<h2>Transport de mon enfant</h2><p><strong>'+txt(record.name)+'</strong> · Elite International · 6e PEII</p>'+
      '<p style="background:#fff1b5;padding:12px;border-radius:10px;font-weight:700">MODE DÉMONSTRATION — aucun trajet ni position GPS réelle.</p>'+
      '<p><strong>Statut :</strong> '+txt(status)+'</p>'+
      '<div style="border:1px solid #d9e2e8;border-radius:14px;padding:15px;margin:12px 0;background:#f4f8fb"><strong>🗺️ Circuit de référence validé</strong><p style="margin:8px 0">Okala (point de prise en charge) → Elite International, La Sablière</p><p style="margin:8px 0;font-size:13px;color:#536476">Trajet témoin validé sur ta capture : 2,1 km · 5 min. Le lien utilise le marché d’Okala comme repère public, pas le point GPS privé ; le parcours peut donc différer.</p><a href="'+routeUrl+'" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:12px;background:#deedff;border-radius:9px;font-weight:700;color:#184e8a">Ouvrir Google Maps (repère public Okala) ↗</a></div>'+
      '<h3>Trajet du matin</h3>'+stages.slice(0,2).map((s,i)=>demoRow(s,i)).join("")+
      '<h3>Trajet du retour</h3>'+stages.slice(2).map((s,i)=>demoRow(s,i+2)).join("")+
      '<button id="nextDemo" class="action">'+(demoStep===4?'Recommencer la simulation':'Confirmer l’étape suivante (démo)')+'</button>'+
      '<p style="font-size:13px;color:#64748b">Chaque clic enregistre l’heure de démonstration au fuseau de Libreville uniquement sur cet écran. Les heures réelles seront transmises par le personnel autorisé et stockées en sécurité. Le bus ne peut pas être localisé avec ces seules confirmations.</p>';
    document.getElementById("nextDemo").onclick=()=>{
      if(demoStep===4){demoStep=0;demoTimes=[null,null,null,null]}
      else {demoTimes[demoStep]=new Intl.DateTimeFormat("fr-FR",{timeZone:"Africa/Libreville",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());demoStep++}
      showTransportSimulation();
    };
  }
  function render(){
    if(!record)return;
    const items=table&&table.days||{},now=new Intl.DateTimeFormat("fr-FR",{weekday:"long",timeZone:"Africa/Libreville"}).format(new Date()),today=now.charAt(0).toUpperCase()+now.slice(1);
    const days=weekly?weekdays:[today];
    root.innerHTML='<h2>Planning de mon enfant</h2><p><strong>'+txt(record.name)+'</strong> · '+txt(record.classId==="elite-6e-peii"?"6e · PEII":record.classId)+'</p><p>Elite International · 2026–2027</p><div class="tabs"><button id="eliteToday" class="'+(!weekly?"active":"")+'">Aujourd’hui</button><button id="eliteWeek" class="'+(weekly?"active":"")+'">Ma semaine</button></div>'+(!table?'<p>Planning en cours d’autorisation dans Firebase.</p>':days.map(day=>'<h3>'+txt(day)+'</h3>'+(items[day]||[]).map(row=>'<div class="lesson"><div><strong>'+txt(row.subject)+'</strong></div><time>'+txt(row.start)+'–'+txt(row.end)+'</time></div>').join("")||'<p>Pas de cours renseigné.</p>').join(""));
    document.getElementById("eliteToday").onclick=()=>{weekly=false;render()};
    document.getElementById("eliteWeek").onclick=()=>{weekly=true;render()};
  }
  function setPage(personal,msg){root.classList.toggle("hidden",!personal);demo.classList.toggle("hidden",personal);if(personal&&msg)root.textContent=msg;}
  async function refresh(user){
    record=null;table=null;weekly=false;
    if(!user){setPage(false);transportView(false);return}
    if(typeof firebase==="undefined"||!firebase.firestore)return;
    const db=firebase.firestore();
    try{
      const parent=await db.collection("parents").doc(user.uid).get();
      if(!parent.exists){setPage(false);transportView(false);return}
      setPage(true,"Chargement de l’emploi du temps personnel…");transportView(true,"Recherche de l’affectation transport…");
      const students=await db.collection("students").where("parentUid","==",user.uid).limit(10).get();
      if(students.empty){setPage(true,"Aucun élève n’est encore associé à ce compte.");return}
      const eligible=students.docs.find(d=>d.data().classId==="elite-6e-peii");
      if(!eligible){setPage(true,"Aucun planning Elite International n’est associé à ce compte.");return}
      record=eligible.data();showTransportSimulation();
      try{
        const doc=await db.collection("timetables").doc("elite-6e-peii-2026-2027").get();
        if(doc.exists)table=doc.data();
      }catch(error){table=null}
      render();
    }catch(error){setPage(true,"Impossible de charger ce dossier. Vérifie les autorisations Firestore.");}
  }
  firebase.auth().onAuthStateChanged(refresh);
})();
