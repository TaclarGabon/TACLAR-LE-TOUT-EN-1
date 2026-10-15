/* Personal planning: Firebase-authenticated, Firestore-backed. */
(function(){
  const root=document.getElementById("elitePersonal"),demo=document.getElementById("planningDemo"),transport=document.getElementById("eliteTransport"),transportDemo=document.getElementById("transportDemo");
  const weekdays=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
  const txt=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
  let record=null,table=null,weekly=false;
  function transportView(personal,message){transport.classList.toggle("hidden",!personal);transportDemo.classList.toggle("hidden",personal);if(personal){transport.textContent=message||"Transport : aucune affectation enregistrée pour cet élève. Les horaires et événements de montée/descente seront affichés après enregistrement par l’administration.";}}
  let demoStep=0;
  const stages=[
    ["Matin","Montée dans le bus","🚌"],
    ["Matin","Arrivée à l’école","🏫"],
    ["Retour","Montée dans le bus","🚌"],
    ["Retour","Arrivée au point de dépose","📍"]
  ];
  function showTransportSimulation(){
    transport.classList.remove("hidden");transportDemo.classList.add("hidden");
    transport.innerHTML='<h2>Transport de mon enfant</h2><p><strong>'+txt(record.name)+'</strong> · Elite International · 6e PEII</p><p style="background:#fff1b5;padding:12px;border-radius:10px;font-weight:700">MODE DÉMONSTRATION — aucun trajet ni horaire réel.</p><h3>Trajet du matin</h3>'+stages.slice(0,2).map((s,i)=>demoRow(s,i)).join("")+'<h3>Trajet du retour</h3>'+stages.slice(2).map((s,i)=>demoRow(s,i+2)).join("")+'<button id="nextDemo" class="action">'+(demoStep===4?'Recommencer la simulation':'Simuler l’étape suivante')+'</button><p style="font-size:13px;color:#64748b">Les confirmations réelles proviendront du chauffeur ou de l’accompagnateur autorisé. Aucun événement de cette démonstration n’est enregistré dans Firebase.</p>';
    document.getElementById("nextDemo").onclick=()=>{demoStep=demoStep===4?0:demoStep+1;showTransportSimulation()};
  }
  function demoRow(s,i){return '<div class="lesson"><div><strong>'+s[2]+' '+s[1]+'</strong><p>'+s[0]+'</p></div><span style="font-size:13px;font-weight:700;color:'+(i<demoStep?'#247451':'#64748b')+'">'+(i<demoStep?'✓ Confirmé (démo)':'En attente')+'</span></div>'}
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
