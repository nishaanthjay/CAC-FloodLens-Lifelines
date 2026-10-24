/** Runs before first paint so the intro never flashes for visitors who will skip it.
 *  Plays once per session, on wide screens only, and never for reduced-motion or data-saver visitors. */
export const introScript = `try{if(location.pathname==="/about"&&innerWidth>=1024&&!sessionStorage.getItem("intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!(navigator.connection&&navigator.connection.saveData))document.documentElement.setAttribute("data-intro","")}catch(e){}`;
