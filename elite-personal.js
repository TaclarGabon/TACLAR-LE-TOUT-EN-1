/* Personal planning: Firebase-authenticated, Firestore-backed. */
(function(){
  const root=document.getElementById("elitePersonal"),demo=document.getElementById("planningDemo");
  const weekdays=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
  const txt=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
  let record=null,table=null,weekly=false;
  function render(){
    if(!record)return;
    const items=table&&table.days||{},now=new Intl.DateTimeFormat("fr-FR",{weekday:"long",timeZone:"Africa/Libreville"}).format(new Date()),today=now.charAt(0).toUpperCase()+now.slice(1);
    const days=weekly?weekdays:[today];
    root.innerHTML='<h2>Mon planning</h2><p><strong>'+txt(record.name)+'</strong> · '+txt(record.classId==="elite-6e-peii"?"6e · PEII":record.classId)+'</p><p>Elite International · 2026–2027</p><div class="tabs"><button id="eliteToday" class="'+(!weekly?"active":"")+'">Aujourd’hui</button><button id="eliteWeek" class="'+(weekly?"active":"")+'">Ma semaine</button></div>'+(!table?'<p>Planning en cours d’autorisation dans Firebase.</p>':days.map(day=>'<h3>'+txt(day)+'</h3>'+(items[day]||[]).map(row=>'<div class="lesson"><div><strong>'+txt(row.subject)+'</strong></div><time>'+txt(row.start)+'–'+txt(row.end)+'</time></div>').join("")||'<p>Pas de cours renseigné.</p>').join(""));
    document.getElementById("eliteToday").onclick=()=>{weekly=false;render()};
    document.getElementById("eliteWeek").onclick=()=>{weekly=true;render()};
  }
  function setPage(personal,msg){root.classList.toggle("hidden",!personal);demo.classList.toggle("hidden",personal);if(personal&&msg)root.textContent=msg;}
  async function refresh(user){
    record=null;table=null;weekly=false;
    if(!user){setPage(false);return}
    if(typeof firebase==="undefined"||!firebase.firestore)return;
    const db=firebase.firestore();
    try{
      const parent=await db.collection("parents").doc(user.uid).get();
      if(!parent.exists){setPage(false);return}
      setPage(true,"Chargement de l’emploi du temps personnel…");
      const students=await db.collection("students").where("parentUid","==",user.uid).limit(10).get();
      if(students.empty){setPage(true,"Aucun élève n’est encore associé à ce compte.");return}
      const eligible=students.docs.find(d=>d.data().classId==="elite-6e-peii");
      if(!eligible){setPage(true,"Aucun planning Elite International n’est associé à ce compte.");return}
      record=eligible.data();
      try{
        const doc=await db.collection("timetables").doc("elite-6e-peii-2026-2027").get();
        if(doc.exists)table=doc.data();
      }catch(error){table=null}
      render();
    }catch(error){setPage(true,"Impossible de charger ce dossier. Vérifie les autorisations Firestore.");}
  }
  firebase.auth().onAuthStateChanged(refresh);
})();
