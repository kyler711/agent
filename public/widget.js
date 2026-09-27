(function () {
  var scripts = document.getElementsByTagName("script");
  var thisScript = scripts[scripts.length - 1];
  var businessKey = thisScript.getAttribute("data-business");
  var color = thisScript.getAttribute("data-color") || "#4f46e5";
  var name = thisScript.getAttribute("data-name") || "Chat with us";

  if (!businessKey) {
    console.error("AI Receptionist widget: missing data-business attribute on the <script> tag.");
    return;
  }

  var baseUrl = thisScript.src.replace(/\/widget\.js.*$/, "");
  var isOpen = false;

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", name);
  bubble.style.cssText = [
    "position:fixed",
    "bottom:20px",
    "right:20px",
    "width:60px",
    "height:60px",
    "border-radius:50%",
    "border:none",
    "cursor:pointer",
    "z-index:2147483000",
    "box-shadow:0 4px 14px rgba(0,0,0,0.25)",
    "background:" + color,
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "transition:transform 0.15s ease",
  ].join(";");
  bubble.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 4h16v12H8l-4 4V4z" fill="white"/></svg>';
  bubble.onmouseenter = function () {
    bubble.style.transform = "scale(1.06)";
  };
  bubble.onmouseleave = function () {
    bubble.style.transform = "scale(1)";
  };

  var frameWrap = document.createElement("div");
  frameWrap.style.cssText = [
    "position:fixed",
    "bottom:90px",
    "right:20px",
    "width:370px",
    "max-width:92vw",
    "height:70vh",
    "max-height:600px",
    "border-radius:16px",
    "overflow:hidden",
    "box-shadow:0 10px 40px rgba(0,0,0,0.3)",
    "display:none",
    "z-index:2147483000",
    "background:white",
  ].join(";");

  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/w/" + encodeURIComponent(businessKey);
  iframe.title = name;
  iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
  frameWrap.appendChild(iframe);

  function applyMobileStyles() {
    if (window.innerWidth < 480) {
      frameWrap.style.width = "100vw";
      frameWrap.style.height = "100vh";
      frameWrap.style.maxHeight = "none";
      frameWrap.style.maxWidth = "none";
      frameWrap.style.bottom = "0";
      frameWrap.style.right = "0";
      frameWrap.style.borderRadius = "0";
    } else {
      frameWrap.style.width = "370px";
      frameWrap.style.height = "70vh";
      frameWrap.style.maxHeight = "600px";
      frameWrap.style.maxWidth = "92vw";
      frameWrap.style.bottom = "90px";
      frameWrap.style.right = "20px";
      frameWrap.style.borderRadius = "16px";
    }
  }

  function toggle() {
    isOpen = !isOpen;
    frameWrap.style.display = isOpen ? "block" : "none";
    bubble.setAttribute("aria-expanded", String(isOpen));
  }
  bubble.addEventListener("click", toggle);

  function mount() {
    document.body.appendChild(frameWrap);
    document.body.appendChild(bubble);
    applyMobileStyles();
    window.addEventListener("resize", applyMobileStyles);
  }

  if (document.body) {
    mount();
  } else {
    window.addEventListener("DOMContentLoaded", mount);
  }
})();
