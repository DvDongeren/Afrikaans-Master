/* Zet het thema voordat de pagina zichtbaar wordt (voorkomt een witte flits). */
try{var t=(JSON.parse(localStorage.getItem('af2'))||{}).theme;if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.dataset.theme='dark'}catch(e){}
