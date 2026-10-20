/* Zet thema, tekstgrootte en lettertype voordat de pagina zichtbaar wordt (voorkomt verspringen). */
try{var s=JSON.parse(localStorage.getItem('af2'))||{},d=document.documentElement,t=s.theme;if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))d.dataset.theme='dark';if(s.fs==='l'||s.fs==='xl')d.dataset.fs=s.fs;if(s.read===true)d.dataset.read='1'}catch(e){}
