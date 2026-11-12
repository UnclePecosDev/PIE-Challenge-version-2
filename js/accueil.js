"use strict";
(function(){
  function updateAccueil(){
    const points=document.getElementById('accueilLiveScore');
    const progress=document.getElementById('accueilLiveLevels');
    if(!points || !progress) return;
    if(typeof state !== 'undefined' && typeof levels !== 'undefined'){
      points.textContent=state.score;
      progress.textContent=state.completedLevels.length + '/' + levels.length;
    }
  }
  if(typeof showView === 'function'){
    const previousShowView=showView;
    showView=function(name){previousShowView(name);updateAccueil();};
  }
  updateAccueil();
  window.addEventListener('pageshow',updateAccueil);
})();
