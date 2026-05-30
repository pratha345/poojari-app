var Pe=Object.defineProperty;var je=(e,t,r)=>t in e?Pe(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var E=(e,t,r)=>je(e,typeof t!="symbol"?t+"":t,r);import{g as le,r as f,R as h}from"./vendor-react-BW-5HAID.js";var He=typeof Element<"u",Me=typeof Map=="function",_e=typeof Set=="function",Re=typeof ArrayBuffer=="function"&&!!ArrayBuffer.isView;function N(e,t){if(e===t)return!0;if(e&&t&&typeof e=="object"&&typeof t=="object"){if(e.constructor!==t.constructor)return!1;var r,n,s;if(Array.isArray(e)){if(r=e.length,r!=t.length)return!1;for(n=r;n--!==0;)if(!N(e[n],t[n]))return!1;return!0}var a;if(Me&&e instanceof Map&&t instanceof Map){if(e.size!==t.size)return!1;for(a=e.entries();!(n=a.next()).done;)if(!t.has(n.value[0]))return!1;for(a=e.entries();!(n=a.next()).done;)if(!N(n.value[1],t.get(n.value[0])))return!1;return!0}if(_e&&e instanceof Set&&t instanceof Set){if(e.size!==t.size)return!1;for(a=e.entries();!(n=a.next()).done;)if(!t.has(n.value[0]))return!1;return!0}if(Re&&ArrayBuffer.isView(e)&&ArrayBuffer.isView(t)){if(r=e.length,r!=t.length)return!1;for(n=r;n--!==0;)if(e[n]!==t[n])return!1;return!0}if(e.constructor===RegExp)return e.source===t.source&&e.flags===t.flags;if(e.valueOf!==Object.prototype.valueOf&&typeof e.valueOf=="function"&&typeof t.valueOf=="function")return e.valueOf()===t.valueOf();if(e.toString!==Object.prototype.toString&&typeof e.toString=="function"&&typeof t.toString=="function")return e.toString()===t.toString();if(s=Object.keys(e),r=s.length,r!==Object.keys(t).length)return!1;for(n=r;n--!==0;)if(!Object.prototype.hasOwnProperty.call(t,s[n]))return!1;if(He&&e instanceof Element)return!1;for(n=r;n--!==0;)if(!((s[n]==="_owner"||s[n]==="__v"||s[n]==="__o")&&e.$$typeof)&&!N(e[s[n]],t[s[n]]))return!1;return!0}return e!==e&&t!==t}var Le=function(t,r){try{return N(t,r)}catch(n){if((n.message||"").match(/stack|recursion/i))return console.warn("react-fast-compare cannot handle circular refs"),!1;throw n}};const Fe=le(Le);var ze=function(e,t,r,n,s,a,i,o){if(!e){var l;if(t===void 0)l=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var c=[r,n,s,a,i,o],u=0;l=new Error(t.replace(/%s/g,function(){return c[u++]})),l.name="Invariant Violation"}throw l.framesToPop=1,l}},Ne=ze;const de=le(Ne);var Ue=function(t,r,n,s){var a=n?n.call(s,t,r):void 0;if(a!==void 0)return!!a;if(t===r)return!0;if(typeof t!="object"||!t||typeof r!="object"||!r)return!1;var i=Object.keys(t),o=Object.keys(r);if(i.length!==o.length)return!1;for(var l=Object.prototype.hasOwnProperty.bind(r),c=0;c<i.length;c++){var u=i[c];if(!l(u))return!1;var d=t[u],p=r[u];if(a=n?n.call(s,d,p,u):void 0,a===!1||a===void 0&&d!==p)return!1}return!0};const qe=le(Ue);var be=(e=>(e.BASE="base",e.BODY="body",e.HEAD="head",e.HTML="html",e.LINK="link",e.META="meta",e.NOSCRIPT="noscript",e.SCRIPT="script",e.STYLE="style",e.TITLE="title",e.FRAGMENT="Symbol(react.fragment)",e))(be||{}),G={link:{rel:["amphtml","canonical","alternate"]},script:{type:["application/ld+json"]},meta:{charset:"",name:["generator","robots","description"],property:["og:type","og:title","og:url","og:image","og:image:alt","og:description","twitter:url","twitter:title","twitter:description","twitter:image","twitter:image:alt","twitter:card","twitter:site"]}},fe=Object.values(be),V={accesskey:"accessKey",charset:"charSet",class:"className",contenteditable:"contentEditable",contextmenu:"contextMenu","http-equiv":"httpEquiv",itemprop:"itemProp",tabindex:"tabIndex"},Te=Object.entries(V).reduce((e,[t,r])=>(e[r]=t,e),{}),b="data-rh",D={DEFAULT_TITLE:"defaultTitle",DEFER:"defer",ENCODE_SPECIAL_CHARACTERS:"encodeSpecialCharacters",ON_CHANGE_CLIENT_STATE:"onChangeClientState",TITLE_TEMPLATE:"titleTemplate",PRIORITIZE_SEO_TAGS:"prioritizeSeoTags"},P=(e,t)=>{for(let r=e.length-1;r>=0;r-=1){const n=e[r];if(Object.prototype.hasOwnProperty.call(n,t))return n[t]}return null},Ke=e=>{let t=P(e,"title");const r=P(e,D.TITLE_TEMPLATE);if(Array.isArray(t)&&(t=t.join("")),r&&t)return r.replace(/%s/g,()=>t);const n=P(e,D.DEFAULT_TITLE);return t||n||void 0},Be=e=>P(e,D.ON_CHANGE_CLIENT_STATE)||(()=>{}),Q=(e,t)=>t.filter(r=>typeof r[e]<"u").map(r=>r[e]).reduce((r,n)=>({...r,...n}),{}),Ve=(e,t)=>t.filter(r=>typeof r.base<"u").map(r=>r.base).reverse().reduce((r,n)=>{if(!r.length){const s=Object.keys(n);for(let a=0;a<s.length;a+=1){const o=s[a].toLowerCase();if(e.indexOf(o)!==-1&&n[o])return r.concat(n)}}return r},[]),Ye=e=>console&&typeof console.warn=="function"&&console.warn(e),H=(e,t,r)=>{const n={};return r.filter(s=>Array.isArray(s[e])?!0:(typeof s[e]<"u"&&Ye(`Helmet: ${e} should be of type "Array". Instead found type "${typeof s[e]}"`),!1)).map(s=>s[e]).reverse().reduce((s,a)=>{const i={};a.filter(l=>{let c;const u=Object.keys(l);for(let p=0;p<u.length;p+=1){const m=u[p],g=m.toLowerCase();t.indexOf(g)!==-1&&!(c==="rel"&&l[c].toLowerCase()==="canonical")&&!(g==="rel"&&l[g].toLowerCase()==="stylesheet")&&(c=g),t.indexOf(m)!==-1&&(m==="innerHTML"||m==="cssText"||m==="itemprop")&&(c=m)}if(!c||!l[c])return!1;const d=l[c].toLowerCase();return n[c]||(n[c]={}),i[c]||(i[c]={}),n[c][d]?!1:(i[c][d]=!0,!0)}).reverse().forEach(l=>s.push(l));const o=Object.keys(i);for(let l=0;l<o.length;l+=1){const c=o[l],u={...n[c],...i[c]};n[c]=u}return s},[]).reverse()},Ze=(e,t)=>{if(Array.isArray(e)&&e.length){for(let r=0;r<e.length;r+=1)if(e[r][t])return!0}return!1},We=e=>({baseTag:Ve(["href"],e),bodyAttributes:Q("bodyAttributes",e),defer:P(e,D.DEFER),encode:P(e,D.ENCODE_SPECIAL_CHARACTERS),htmlAttributes:Q("htmlAttributes",e),linkTags:H("link",["rel","href"],e),metaTags:H("meta",["name","charset","http-equiv","property","itemprop"],e),noscriptTags:H("noscript",["innerHTML"],e),onChangeClientState:Be(e),scriptTags:H("script",["src","innerHTML"],e),styleTags:H("style",["cssText"],e),title:Ke(e),titleAttributes:Q("titleAttributes",e),prioritizeSeoTags:Ze(e,D.PRIORITIZE_SEO_TAGS)}),Ae=e=>Array.isArray(e)?e.join(""):e,Ge=(e,t)=>{const r=Object.keys(e);for(let n=0;n<r.length;n+=1)if(t[r[n]]&&t[r[n]].includes(e[r[n]]))return!0;return!1},J=(e,t)=>Array.isArray(e)?e.reduce((r,n)=>(Ge(n,t)?r.priority.push(n):r.default.push(n),r),{priority:[],default:[]}):{default:e,priority:[]},pe=(e,t)=>({...e,[t]:void 0}),Qe=["noscript","script","style"],te=(e,t=!0)=>t===!1?String(e):String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;"),Ee=e=>Object.keys(e).reduce((t,r)=>{const n=typeof e[r]<"u"?`${r}="${e[r]}"`:`${r}`;return t?`${t} ${n}`:n},""),Je=(e,t,r,n)=>{const s=Ee(r),a=Ae(t);return s?`<${e} ${b}="true" ${s}>${te(a,n)}</${e}>`:`<${e} ${b}="true">${te(a,n)}</${e}>`},Xe=(e,t,r=!0)=>t.reduce((n,s)=>{const a=s,i=Object.keys(a).filter(c=>!(c==="innerHTML"||c==="cssText")).reduce((c,u)=>{const d=typeof a[u]>"u"?u:`${u}="${te(a[u],r)}"`;return c?`${c} ${d}`:d},""),o=a.innerHTML||a.cssText||"",l=Qe.indexOf(e)===-1;return`${n}<${e} ${b}="true" ${i}${l?"/>":`>${o}</${e}>`}`},""),xe=(e,t={})=>Object.keys(e).reduce((r,n)=>{const s=V[n];return r[s||n]=e[n],r},t),et=(e,t,r)=>{const n={key:t,[b]:!0},s=xe(r,n);return[h.createElement("title",s,t)]},U=(e,t)=>t.map((r,n)=>{const s={key:n,[b]:!0};return Object.keys(r).forEach(a=>{const o=V[a]||a;if(o==="innerHTML"||o==="cssText"){const l=r.innerHTML||r.cssText;s.dangerouslySetInnerHTML={__html:l}}else s[o]=r[a]}),h.createElement(e,s)}),v=(e,t,r=!0)=>{switch(e){case"title":return{toComponent:()=>et(e,t.title,t.titleAttributes),toString:()=>Je(e,t.title,t.titleAttributes,r)};case"bodyAttributes":case"htmlAttributes":return{toComponent:()=>xe(t),toString:()=>Ee(t)};default:return{toComponent:()=>U(e,t),toString:()=>Xe(e,t,r)}}},tt=({metaTags:e,linkTags:t,scriptTags:r,encode:n})=>{const s=J(e,G.meta),a=J(t,G.link),i=J(r,G.script);return{priorityMethods:{toComponent:()=>[...U("meta",s.priority),...U("link",a.priority),...U("script",i.priority)],toString:()=>`${v("meta",s.priority,n)} ${v("link",a.priority,n)} ${v("script",i.priority,n)}`},metaTags:s.default,linkTags:a.default,scriptTags:i.default}},rt=e=>{const{baseTag:t,bodyAttributes:r,encode:n=!0,htmlAttributes:s,noscriptTags:a,styleTags:i,title:o="",titleAttributes:l,prioritizeSeoTags:c}=e;let{linkTags:u,metaTags:d,scriptTags:p}=e,m={toComponent:()=>[],toString:()=>""};return c&&({priorityMethods:m,linkTags:u,metaTags:d,scriptTags:p}=tt(e)),{priority:m,base:v("base",t,n),bodyAttributes:v("bodyAttributes",r,n),htmlAttributes:v("htmlAttributes",s,n),link:v("link",u,n),meta:v("meta",d,n),noscript:v("noscript",a,n),script:v("script",p,n),style:v("style",i,n),title:v("title",{title:o,titleAttributes:l},n)}},re=rt,F=[],ce=!!(typeof window<"u"&&window.document&&window.document.createElement),ne=class{constructor(e,t){E(this,"instances",[]);E(this,"canUseDOM",ce);E(this,"context");E(this,"value",{setHelmet:e=>{this.context.helmet=e},helmetInstances:{get:()=>this.canUseDOM?F:this.instances,add:e=>{(this.canUseDOM?F:this.instances).push(e)},remove:e=>{const t=(this.canUseDOM?F:this.instances).indexOf(e);(this.canUseDOM?F:this.instances).splice(t,1)}}});this.context=e,this.canUseDOM=t||!1,t||(e.helmet=re({baseTag:[],bodyAttributes:{},htmlAttributes:{},linkTags:[],metaTags:[],noscriptTags:[],scriptTags:[],styleTags:[],title:"",titleAttributes:{}}))}},nt=parseInt(h.version.split(".")[0],10),se=nt>=19,st={},we=h.createContext(st),$,at=($=class extends f.Component{constructor(r){super(r);E(this,"helmetData");se?this.helmetData=null:this.helmetData=new ne(this.props.context||{},$.canUseDOM)}render(){return se?h.createElement(h.Fragment,null,this.props.children):h.createElement(we.Provider,{value:this.helmetData.value},this.props.children)}},E($,"canUseDOM",ce),$),I=(e,t)=>{const r=document.head||document.querySelector("head"),n=r.querySelectorAll(`${e}[${b}]`),s=[].slice.call(n),a=[];let i;return t&&t.length&&t.forEach(o=>{const l=document.createElement(e);for(const c in o)if(Object.prototype.hasOwnProperty.call(o,c))if(c==="innerHTML")l.innerHTML=o.innerHTML;else if(c==="cssText"){const u=o.cssText;l.appendChild(document.createTextNode(u))}else{const u=c,d=typeof o[u]>"u"?"":o[u];l.setAttribute(c,d)}l.setAttribute(b,"true"),s.some((c,u)=>(i=u,l.isEqualNode(c)))?s.splice(i,1):a.push(l)}),s.forEach(o=>o.parentNode?.removeChild(o)),a.forEach(o=>r.appendChild(o)),{oldTags:s,newTags:a}},ae=(e,t)=>{const r=document.getElementsByTagName(e)[0];if(!r)return;const n=r.getAttribute(b),s=n?n.split(","):[],a=[...s],i=Object.keys(t);for(const o of i){const l=t[o]||"";r.getAttribute(o)!==l&&r.setAttribute(o,l),s.indexOf(o)===-1&&s.push(o);const c=a.indexOf(o);c!==-1&&a.splice(c,1)}for(let o=a.length-1;o>=0;o-=1)r.removeAttribute(a[o]);s.length===a.length?r.removeAttribute(b):r.getAttribute(b)!==i.join(",")&&r.setAttribute(b,i.join(","))},it=(e,t)=>{typeof e<"u"&&document.title!==e&&(document.title=Ae(e)),ae("title",t)},me=(e,t)=>{const{baseTag:r,bodyAttributes:n,htmlAttributes:s,linkTags:a,metaTags:i,noscriptTags:o,onChangeClientState:l,scriptTags:c,styleTags:u,title:d,titleAttributes:p}=e;ae("body",n),ae("html",s),it(d,p);const m={baseTag:I("base",r),linkTags:I("link",a),metaTags:I("meta",i),noscriptTags:I("noscript",o),scriptTags:I("script",c),styleTags:I("style",u)},g={},j={};Object.keys(m).forEach(O=>{const{newTags:R,oldTags:L}=m[O];R.length&&(g[O]=R),L.length&&(j[O]=m[O].oldTags)}),t&&t(),l(e,g,j)},M=null,ot=e=>{M&&cancelAnimationFrame(M),e.defer?M=requestAnimationFrame(()=>{me(e,()=>{M=null})}):(me(e),M=null)},lt=ot,he=class extends f.Component{constructor(){super(...arguments);E(this,"rendered",!1)}shouldComponentUpdate(t){return!qe(t,this.props)}componentDidUpdate(){this.emitChange()}componentWillUnmount(){const{helmetInstances:t}=this.props.context;t.remove(this),this.emitChange()}emitChange(){const{helmetInstances:t,setHelmet:r}=this.props.context;let n=null;const s=We(t.get().map(a=>{const{context:i,...o}=a.props;return o}));at.canUseDOM?lt(s):re&&(n=re(s)),r(n)}init(){if(this.rendered)return;this.rendered=!0;const{helmetInstances:t}=this.props.context;t.add(this),this.emitChange()}render(){return this.init(),null}},q=[],ye=e=>{const t={};for(const r of Object.keys(e))t[Te[r]||r]=e[r];return t},k=e=>{const t={};for(const r of Object.keys(e)){const n=V[r];t[n||r]=e[r]}return t},ge=(e,t)=>{if(!ce)return;const r=document.getElementsByTagName(e)[0];if(!r)return;const n="data-rh-managed",s=r.getAttribute(n),a=s?s.split(","):[],i=Object.keys(t);for(const o of a)i.includes(o)||r.removeAttribute(o);for(const o of i){const l=t[o];l==null||l===!1?r.removeAttribute(o):l===!0?r.setAttribute(o,""):r.setAttribute(o,String(l))}i.length>0?r.setAttribute(n,i.join(",")):r.removeAttribute(n)},X=()=>{const e={},t={};for(const r of q){const{htmlAttributes:n,bodyAttributes:s}=r.props;n&&Object.assign(e,ye(n)),s&&Object.assign(t,ye(s))}ge("html",e),ge("body",t)},ct=class extends f.Component{componentDidMount(){q.push(this),X()}componentDidUpdate(){X()}componentWillUnmount(){const e=q.indexOf(this);e!==-1&&q.splice(e,1),X()}resolveTitle(){const{title:e,titleTemplate:t,defaultTitle:r}=this.props;return e&&t?t.replace(/%s/g,()=>Array.isArray(e)?e.join(""):e):e||r||void 0}renderTitle(){const e=this.resolveTitle();if(e===void 0)return null;const t=this.props.titleAttributes||{};return h.createElement("title",k(t),e)}renderBase(){const{base:e}=this.props;return e?h.createElement("base",k(e)):null}renderMeta(){const{meta:e}=this.props;return!e||!Array.isArray(e)?null:e.map((t,r)=>h.createElement("meta",{key:r,...k(t)}))}renderLink(){const{link:e}=this.props;return!e||!Array.isArray(e)?null:e.map((t,r)=>h.createElement("link",{key:r,...k(t)}))}renderScript(){const{script:e}=this.props;return!e||!Array.isArray(e)?null:e.map((t,r)=>{const{innerHTML:n,...s}=t,a=k(s);return n&&(a.dangerouslySetInnerHTML={__html:n}),h.createElement("script",{key:r,...a})})}renderStyle(){const{style:e}=this.props;return!e||!Array.isArray(e)?null:e.map((t,r)=>{const{cssText:n,...s}=t,a=k(s);return n&&(a.dangerouslySetInnerHTML={__html:n}),h.createElement("style",{key:r,...a})})}renderNoscript(){const{noscript:e}=this.props;return!e||!Array.isArray(e)?null:e.map((t,r)=>{const{innerHTML:n,...s}=t,a=k(s);return n&&(a.dangerouslySetInnerHTML={__html:n}),h.createElement("noscript",{key:r,...a})})}render(){return h.createElement(h.Fragment,null,this.renderTitle(),this.renderBase(),this.renderMeta(),this.renderLink(),this.renderScript(),this.renderStyle(),this.renderNoscript())}},ee,Xt=(ee=class extends f.Component{shouldComponentUpdate(e){return!Fe(pe(this.props,"helmetData"),pe(e,"helmetData"))}mapNestedChildrenToProps(e,t){if(!t)return null;switch(e.type){case"script":case"noscript":return{innerHTML:t};case"style":return{cssText:t};default:throw new Error(`<${e.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`)}}flattenArrayTypeChildren(e,t,r,n){return{...t,[e.type]:[...t[e.type]||[],{...r,...this.mapNestedChildrenToProps(e,n)}]}}mapObjectTypeChildren(e,t,r,n){switch(e.type){case"title":return{...t,[e.type]:n,titleAttributes:{...r}};case"body":return{...t,bodyAttributes:{...r}};case"html":return{...t,htmlAttributes:{...r}};default:return{...t,[e.type]:{...r}}}}mapArrayTypeChildrenToProps(e,t){let r={...t};return Object.keys(e).forEach(n=>{r={...r,[n]:e[n]}}),r}warnOnInvalidChildren(e,t){return de(fe.some(r=>e.type===r),typeof e.type=="function"?"You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.":`Only elements types ${fe.join(", ")} are allowed. Helmet does not support rendering <${e.type}> elements. Refer to our API for more information.`),de(!t||typeof t=="string"||Array.isArray(t)&&!t.some(r=>typeof r!="string"),`Helmet expects a string as a child of <${e.type}>. Did you forget to wrap your children in braces? ( <${e.type}>{\`\`}</${e.type}> ) Refer to our API for more information.`),!0}mapChildrenToProps(e,t){let r={};return h.Children.forEach(e,n=>{if(!n||!n.props)return;const{children:s,...a}=n.props,i=Object.keys(a).reduce((l,c)=>(l[Te[c]||c]=a[c],l),{});let{type:o}=n;switch(typeof o=="symbol"?o=o.toString():this.warnOnInvalidChildren(n,s),o){case"Symbol(react.fragment)":t=this.mapChildrenToProps(s,t);break;case"link":case"meta":case"noscript":case"script":case"style":r=this.flattenArrayTypeChildren(n,r,i,s);break;default:t=this.mapObjectTypeChildren(n,t,i,s);break}}),this.mapArrayTypeChildrenToProps(r,t)}render(){const{children:e,...t}=this.props;let r={...t},{helmetData:n}=t;if(e&&(r=this.mapChildrenToProps(e,r)),n&&!(n instanceof ne)){const s=n;n=new ne(s.context,!0),delete r.helmetData}return se?h.createElement(ct,{...r}):n?h.createElement(he,{...r,context:n.value}):h.createElement(we.Consumer,null,s=>h.createElement(he,{...r,context:s}))}},E(ee,"defaultProps",{defer:!0,encodeSpecialCharacters:!0,prioritizeSeoTags:!1}),ee);let ut={data:""},dt=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||ut},ft=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,pt=/\/\*[^]*?\*\/|  +/g,ve=/\n+/g,C=(e,t)=>{let r="",n="",s="";for(let a in e){let i=e[a];a[0]=="@"?a[1]=="i"?r=a+" "+i+";":n+=a[1]=="f"?C(i,a):a+"{"+C(i,a[1]=="k"?"":t)+"}":typeof i=="object"?n+=C(i,t?t.replace(/([^,])+/g,o=>a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,o):o?o+" "+l:l)):a):i!=null&&(a=/^--/.test(a)?a:a.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=C.p?C.p(a,i):a+":"+i+";")}return r+(t&&s?t+"{"+s+"}":s)+n},x={},Oe=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+Oe(e[r]);return t}return e},mt=(e,t,r,n,s)=>{let a=Oe(e),i=x[a]||(x[a]=(l=>{let c=0,u=11;for(;c<l.length;)u=101*u+l.charCodeAt(c++)>>>0;return"go"+u})(a));if(!x[i]){let l=a!==e?e:(c=>{let u,d,p=[{}];for(;u=ft.exec(c.replace(pt,""));)u[4]?p.shift():u[3]?(d=u[3].replace(ve," ").trim(),p.unshift(p[0][d]=p[0][d]||{})):p[0][u[1]]=u[2].replace(ve," ").trim();return p[0]})(e);x[i]=C(s?{["@keyframes "+i]:l}:l,r?"":"."+i)}let o=r&&x.g?x.g:null;return r&&(x.g=x[i]),((l,c,u,d)=>{d?c.data=c.data.replace(d,l):c.data.indexOf(l)===-1&&(c.data=u?l+c.data:c.data+l)})(x[i],t,n,o),i},ht=(e,t,r)=>e.reduce((n,s,a)=>{let i=t[a];if(i&&i.call){let o=i(r),l=o&&o.props&&o.props.className||/^go/.test(o)&&o;i=l?"."+l:o&&typeof o=="object"?o.props?"":C(o,""):o===!1?"":o}return n+s+(i??"")},"");function Y(e){let t=this||{},r=e.call?e(t.p):e;return mt(r.unshift?r.raw?ht(r,[].slice.call(arguments,1),t.p):r.reduce((n,s)=>Object.assign(n,s&&s.call?s(t.p):s),{}):r,dt(t.target),t.g,t.o,t.k)}let Ce,ie,oe;Y.bind({g:1});let w=Y.bind({k:1});function yt(e,t,r,n){C.p=t,Ce=e,ie=r,oe=n}function S(e,t){let r=this||{};return function(){let n=arguments;function s(a,i){let o=Object.assign({},a),l=o.className||s.className;r.p=Object.assign({theme:ie&&ie()},o),r.o=/ *go\d+/.test(l),o.className=Y.apply(r,n)+(l?" "+l:"");let c=e;return e[0]&&(c=o.as||e,delete o.as),oe&&c[0]&&oe(o),Ce(c,o)}return s}}var gt=e=>typeof e=="function",B=(e,t)=>gt(e)?e(t):e,vt=(()=>{let e=0;return()=>(++e).toString()})(),Se=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),bt=20,ue="default",ke=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(i=>i.id===t.toast.id?{...i,...t.toast}:i)};case 2:let{toast:n}=t;return ke(e,{type:e.toasts.find(i=>i.id===n.id)?1:0,toast:n});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(i=>i.id===s||s===void 0?{...i,dismissed:!0,visible:!1}:i)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(i=>i.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+a}))}}},K=[],$e={toasts:[],pausedAt:void 0,settings:{toastLimit:bt}},A={},Ie=(e,t=ue)=>{A[t]=ke(A[t]||$e,e),K.forEach(([r,n])=>{r===t&&n(A[t])})},De=e=>Object.keys(A).forEach(t=>Ie(e,t)),Tt=e=>Object.keys(A).find(t=>A[t].toasts.some(r=>r.id===e)),Z=(e=ue)=>t=>{Ie(t,e)},At={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Et=(e={},t=ue)=>{let[r,n]=f.useState(A[t]||$e),s=f.useRef(A[t]);f.useEffect(()=>(s.current!==A[t]&&n(A[t]),K.push([t,n]),()=>{let i=K.findIndex(([o])=>o===t);i>-1&&K.splice(i,1)}),[t]);let a=r.toasts.map(i=>{var o,l,c;return{...e,...e[i.type],...i,removeDelay:i.removeDelay||((o=e[i.type])==null?void 0:o.removeDelay)||e?.removeDelay,duration:i.duration||((l=e[i.type])==null?void 0:l.duration)||e?.duration||At[i.type],style:{...e.style,...(c=e[i.type])==null?void 0:c.style,...i.style}}});return{...r,toasts:a}},xt=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:r?.id||vt()}),_=e=>(t,r)=>{let n=xt(t,e,r);return Z(n.toasterId||Tt(n.id))({type:2,toast:n}),n.id},y=(e,t)=>_("blank")(e,t);y.error=_("error");y.success=_("success");y.loading=_("loading");y.custom=_("custom");y.dismiss=(e,t)=>{let r={type:3,toastId:e};t?Z(t)(r):De(r)};y.dismissAll=e=>y.dismiss(void 0,e);y.remove=(e,t)=>{let r={type:4,toastId:e};t?Z(t)(r):De(r)};y.removeAll=e=>y.remove(void 0,e);y.promise=(e,t,r)=>{let n=y.loading(t.loading,{...r,...r?.loading});return typeof e=="function"&&(e=e()),e.then(s=>{let a=t.success?B(t.success,s):void 0;return a?y.success(a,{id:n,...r,...r?.success}):y.dismiss(n),s}).catch(s=>{let a=t.error?B(t.error,s):void 0;a?y.error(a,{id:n,...r,...r?.error}):y.dismiss(n)}),e};var wt=1e3,Ot=(e,t="default")=>{let{toasts:r,pausedAt:n}=Et(e,t),s=f.useRef(new Map).current,a=f.useCallback((d,p=wt)=>{if(s.has(d))return;let m=setTimeout(()=>{s.delete(d),i({type:4,toastId:d})},p);s.set(d,m)},[]);f.useEffect(()=>{if(n)return;let d=Date.now(),p=r.map(m=>{if(m.duration===1/0)return;let g=(m.duration||0)+m.pauseDuration-(d-m.createdAt);if(g<0){m.visible&&y.dismiss(m.id);return}return setTimeout(()=>y.dismiss(m.id,t),g)});return()=>{p.forEach(m=>m&&clearTimeout(m))}},[r,n,t]);let i=f.useCallback(Z(t),[t]),o=f.useCallback(()=>{i({type:5,time:Date.now()})},[i]),l=f.useCallback((d,p)=>{i({type:1,toast:{id:d,height:p}})},[i]),c=f.useCallback(()=>{n&&i({type:6,time:Date.now()})},[n,i]),u=f.useCallback((d,p)=>{let{reverseOrder:m=!1,gutter:g=8,defaultPosition:j}=p||{},O=r.filter(T=>(T.position||j)===(d.position||j)&&T.height),R=O.findIndex(T=>T.id===d.id),L=O.filter((T,W)=>W<R&&T.visible).length;return O.filter(T=>T.visible).slice(...m?[L+1]:[0,L]).reduce((T,W)=>T+(W.height||0)+g,0)},[r]);return f.useEffect(()=>{r.forEach(d=>{if(d.dismissed)a(d.id,d.removeDelay);else{let p=s.get(d.id);p&&(clearTimeout(p),s.delete(d.id))}})},[r,a]),{toasts:r,handlers:{updateHeight:l,startPause:o,endPause:c,calculateOffset:u}}},Ct=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,St=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,kt=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,$t=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ct} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${St} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${kt} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,It=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Dt=S("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${It} 1s linear infinite;
`,Pt=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,jt=w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Ht=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Pt} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${jt} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Mt=S("div")`
  position: absolute;
`,_t=S("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Rt=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Lt=S("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Rt} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ft=({toast:e})=>{let{icon:t,type:r,iconTheme:n}=e;return t!==void 0?typeof t=="string"?f.createElement(Lt,null,t):t:r==="blank"?null:f.createElement(_t,null,f.createElement(Dt,{...n}),r!=="loading"&&f.createElement(Mt,null,r==="error"?f.createElement($t,{...n}):f.createElement(Ht,{...n})))},zt=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Nt=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ut="0%{opacity:0;} 100%{opacity:1;}",qt="0%{opacity:1;} 100%{opacity:0;}",Kt=S("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Bt=S("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Vt=(e,t)=>{let r=e.includes("top")?1:-1,[n,s]=Se()?[Ut,qt]:[zt(r),Nt(r)];return{animation:t?`${w(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Yt=f.memo(({toast:e,position:t,style:r,children:n})=>{let s=e.height?Vt(e.position||t||"top-center",e.visible):{opacity:0},a=f.createElement(Ft,{toast:e}),i=f.createElement(Bt,{...e.ariaProps},B(e.message,e));return f.createElement(Kt,{className:e.className,style:{...s,...r,...e.style}},typeof n=="function"?n({icon:a,message:i}):f.createElement(f.Fragment,null,a,i))});yt(f.createElement);var Zt=({id:e,className:t,style:r,onHeightUpdate:n,children:s})=>{let a=f.useCallback(i=>{if(i){let o=()=>{let l=i.getBoundingClientRect().height;n(e,l)};o(),new MutationObserver(o).observe(i,{subtree:!0,childList:!0,characterData:!0})}},[e,n]);return f.createElement("div",{ref:a,className:t,style:r},s)},Wt=(e,t)=>{let r=e.includes("top"),n=r?{top:0}:{bottom:0},s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:Se()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...n,...s}},Gt=Y`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,z=16,er=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:n,children:s,toasterId:a,containerStyle:i,containerClassName:o})=>{let{toasts:l,handlers:c}=Ot(r,a);return f.createElement("div",{"data-rht-toaster":a||"",style:{position:"fixed",zIndex:9999,top:z,left:z,right:z,bottom:z,pointerEvents:"none",...i},className:o,onMouseEnter:c.startPause,onMouseLeave:c.endPause},l.map(u=>{let d=u.position||t,p=c.calculateOffset(u,{reverseOrder:e,gutter:n,defaultPosition:t}),m=Wt(d,p);return f.createElement(Zt,{id:u.id,key:u.id,onHeightUpdate:c.updateHeight,className:u.visible?Gt:"",style:m},u.type==="custom"?B(u.message,u):s?s(u):f.createElement(Yt,{toast:u,position:d}))}))},tr=y;export{er as F,Xt as H,at as a,tr as z};
