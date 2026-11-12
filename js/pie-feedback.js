/* PIE CHALLENGE: original arcade sounds, user-controlled background music,
   Jeff Bezos correct/wrong reaction and level-finished celebration.
   Integrates with js/app.js through explicit PIEFX callbacks; does not award points. */
(() => {
  'use strict';
  const shell = document.createElement('div');
  shell.innerHTML = `
    <button id="pieSoundToggle" class="pie-sound-toggle" type="button"
       aria-label="Activer ou couper les sons" title="Activer ou couper les sons"></button>
    <div id="pieMascotPopup" class="pie-mascot-popup" role="status" aria-live="polite" aria-atomic="true">
       <div class="pie-mascot-bubble" id="pieMascotText"></div>
       <img class="pie-mascot-face" id="pieMascotFace" src="images/jeff-bravo.png" alt="Jeff Bezos en dessin animé">
    </div>
    <div id="pieVictory" class="pie-victory" role="dialog" aria-modal="true" aria-labelledby="pieVictoryTitle" aria-hidden="true">
      <div class="pie-victory-board">
         <span class="pie-victory-tag" id="pieVictoryTag">PIE CHALLENGE</span>
         <h2 class="pie-victory-title" id="pieVictoryTitle">MISSION ACCOMPLIE !</h2>
         <div class="pie-victory-stars" aria-hidden="true">⭐ ⭐ ⭐</div>
         <p class="pie-victory-level" id="pieVictoryLevel"></p>
         <p class="pie-victory-message" id="pieVictoryMessage"></p>
         <p class="pie-victory-score" id="pieVictoryScore"></p>
         <div class="pie-victory-actions">
           <button id="pieVictoryNext" type="button">▶ Niveau suivant</button>
           <button id="pieVictoryClose" type="button">Voir les résultats</button>
         </div>
      </div>
    </div>`;
  document.body.appendChild(shell);
  const $ = id => document.getElementById(id);
  const toggle = $('pieSoundToggle');
  const popup = $('pieMascotPopup');
  const bubble = $('pieMascotText');
  const face = $('pieMascotFace');
  const victory = $('pieVictory');
  const music = new Audio('sounds/background.mp3');
  music.loop = true;
  music.volume = 0.14;
  music.preload = 'auto';
  const sounds = Object.fromEntries(['correct','wrong','victory'].map(kind => {
    const audio = new Audio(`sounds/${kind}.mp3`);
    audio.preload = 'auto';
    audio.volume = kind === 'wrong' ? 0.42 : kind === 'correct' ? 0.52 : 0.64;
    return [kind,audio];
  }));
  let enabled = true;
  try { enabled = localStorage.getItem('pie-sound-enabled') !== 'false'; }
  catch (_) {}
  let unlocked = false;
  let hideTimer;
  let precedingFocus = null;
  function safePlay(audio) { if (!enabled) return;
    const promise = audio.play(); if (promise?.catch) promise.catch(() => {});
  }
  function startMusic() {
    if (enabled && unlocked && !document.hidden && !victory.classList.contains('active')) safePlay(music);
  }
  function updateToggle() {
    toggle.textContent = enabled ? '🔊 Son' : '🔇 Muet';
    toggle.setAttribute('aria-pressed',String(enabled));
  }
  function unlock() { unlocked = true; startMusic(); }
  document.addEventListener('pointerdown',unlock,{once:true});
  document.addEventListener('keydown',unlock,{once:true});
  toggle.addEventListener('click',() => {
    enabled = !enabled; unlocked = true;
    try { localStorage.setItem('pie-sound-enabled',String(enabled)); } catch (_) {}
    if (enabled) startMusic(); else {
       music.pause(); Object.values(sounds).forEach(a => {a.pause(); a.currentTime=0;});
    }
    updateToggle();
  });
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) music.pause(); else startMusic();
  });
  updateToggle();
  function effect(kind) {
    const audio = sounds[kind]; if (!audio || !enabled) return;
    audio.pause(); audio.currentTime=0; safePlay(audio);
  }
  function hideMascot() {
    clearTimeout(hideTimer); popup.classList.remove('show');
  }
  function mascot(kind, message) {
    hideMascot(); popup.classList.remove('correct','wrong');
    void popup.offsetWidth;
    popup.classList.add(kind,'show');
    bubble.textContent = message;
    face.src = kind === 'correct' ? 'images/jeff-bravo.png' : 'images/jeff-oups.png';
    effect(kind);
    hideTimer=setTimeout(hideMascot,2200);
  }
  function correct({points=100,message}={}) {
    mascot('correct',message || (points>0 ? `⚡ BRAVO ! Réponse correcte (+${points} pts)` : '⚡ BRAVO ! Bien joué !'));
  }
  function wrong({message}={}) {
    mascot('wrong',message || '💥 OUPS ! Mauvaise réponse, réessaie !');
  }
  const colors=['#ffdf2b','#ff4c76','#35c8f6','#43d876','#9639e9'];
  function confetti() {
    for(let i=0; i<42; i++) {
      const chip=document.createElement('span');
      chip.className='pie-confetti';
      chip.style.left=`${Math.random()*98}vw`;
      chip.style.background=colors[i%colors.length];
      chip.style.setProperty('--duration',`${1.6+Math.random()*1.8}s`);
      chip.style.setProperty('--drift',`${Math.round((Math.random()-.5)*150)}px`);
      chip.addEventListener('animationend',()=>chip.remove(),{once:true});
      document.body.appendChild(chip);
      setTimeout(()=>chip.remove(),3900);
    }
  }
  function showVictory({levelId,levelTitle,score,last=false}={}) {
    hideMascot(); music.pause();
    precedingFocus=document.activeElement;
    $('pieVictoryTag').textContent=`NIVEAU ${levelId} TERMINÉ !`;
    $('pieVictoryTitle').textContent= last ? 'CHAMPION DU PIE !' : 'MISSION ACCOMPLIE !';
    $('pieVictoryLevel').textContent=levelTitle || `Niveau ${levelId}`;
    $('pieVictoryMessage').textContent=last ? 'Bravo ! Tu as terminé les 7 niveaux du PIE Challenge !' : 'Bravo ! Tu as réussi ce niveau et débloqué le suivant !';
    $('pieVictoryScore').textContent=`⭐ Score total : ${score ?? 0} points`;
    $('pieVictoryNext').textContent=last?'↻ Rejouer le niveau 1':'▶ Niveau suivant !';
    victory.classList.add('active'); victory.setAttribute('aria-hidden','false');
    effect('victory');
    confetti();
    $('pieVictoryNext').focus();
  }
  function closeVictory() {
    victory.classList.remove('active'); victory.setAttribute('aria-hidden','true');
    startMusic();
    if (precedingFocus && typeof precedingFocus.focus==='function') precedingFocus.focus();
  }
  $('pieVictoryClose').addEventListener('click',closeVictory);
  $('pieVictoryNext').addEventListener('click',()=> {
    closeVictory();
    if (typeof window.goNextLevel === 'function') window.goNextLevel();
  });
  document.addEventListener('keydown',event=> {
    if (!victory.classList.contains('active')) return;
    if (event.key === 'Escape') closeVictory();
    if (event.key === 'Tab') {
      const buttons=[$('pieVictoryNext'),$('pieVictoryClose')];
      const ix=buttons.indexOf(document.activeElement);
      if (event.shiftKey && ix===0) {event.preventDefault();buttons[1].focus();}
      else if (!event.shiftKey && ix===1) {event.preventDefault();buttons[0].focus();}
    }
  });
  window.PIEFX={correct,wrong,victory:showVictory,hideMascot,closeVictory,
    playEffect:effect,startMusic,stopMusic:()=>music.pause()};
})();
