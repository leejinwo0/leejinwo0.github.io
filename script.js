// ---------------------------------------------------------
// 1. 상단 메뉴: 스크롤 위치에 맞춰 지금 보는 섹션 강조
//    화면 위에서 OFFSET(px) 지점을 지난 섹션 중 가장 아래 것을 '보고 있는 섹션'으로 판단
// ---------------------------------------------------------
const links = [...document.querySelectorAll(".nav-link")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
const OFFSET = 120;
let lockUntil = 0; // 메뉴 클릭 직후 잠깐 자동 판단을 멈추는 시각

function setActive(id) {
  links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
}

function updateActive() {
  if (Date.now() < lockUntil) return;
  let current = null;
  sections.forEach((sec) => {
    if (sec && sec.getBoundingClientRect().top - OFFSET <= 0) current = sec;
  });
  // 페이지 맨 아래에 닿으면 마지막 섹션 강조
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }
  setActive(current ? current.id : "");
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateActive();
    ticking = false;
  });
});

// 메뉴를 누르면 바로 강조하고, 이동하는 1초 동안은 자동 판단 멈춤
links.forEach((a) => {
  a.addEventListener("click", () => {
    setActive(a.getAttribute("href").slice(1));
    lockUntil = Date.now() + 1000;
  });
});

updateActive();

// ---------------------------------------------------------
// 2. 이메일 · GitHub 주소 팝업
//    .js-popup 버튼의 data-title, data-value를 팝업에 넣고 띄웁니다.
//    data-link가 있으면 "바로가기" 버튼을 보여주고 그 주소로 연결합니다.
// ---------------------------------------------------------
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupValue = document.getElementById("popup-value");
const copyBtn = document.getElementById("popup-copy");
const goBtn = document.getElementById("popup-go");

document.querySelectorAll(".js-popup").forEach((btn) => {
  btn.addEventListener("click", () => {
    popupTitle.textContent = btn.dataset.title;
    popupValue.textContent = btn.dataset.value;
    copyBtn.textContent = "복사";
    // 바로가기: data-link가 있을 때만 보이기 (GitHub)
    goBtn.hidden = !btn.dataset.link;
    if (btn.dataset.link) goBtn.href = btn.dataset.link;
    popup.showModal(); // 화면 가운데에 팝업 열기 (ESC로도 닫힘)
  });
});

// 복사 버튼
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(popupValue.textContent);
    copyBtn.textContent = "복사됨";
  } catch {
    copyBtn.textContent = "직접 선택해 복사해주세요";
  }
});

// 닫기 버튼 · 바깥 클릭으로 닫기
document.getElementById("popup-close").addEventListener("click", () => popup.close());
popup.addEventListener("click", (e) => {
  if (e.target === popup) popup.close();
});

// ---------------------------------------------------------
// 3. 프로젝트 문서 미리보기 팝업
//    PDF 위치 = data-folder + "/" + data-docs + ".pdf" (여러 개면 쉼표로 → 탭)
//    탭 이름 = 파일 이름 끝의 문서종류(DOC_TYPES), 없으면 버튼 글자
// ---------------------------------------------------------
const DOC_TYPES = {
  plan: "수행계획서",
  report: "결과보고서",
  design: "화면설계서",
  summary: "프로젝트정리",
};

function docLabel(file, fallback) {
  const type = Object.keys(DOC_TYPES).find((t) => file.endsWith("-" + t));
  return type ? DOC_TYPES[type] : fallback;
}

const docPopup = document.getElementById("doc-popup");
const docTitle = document.getElementById("doc-title");
const docTabs = document.getElementById("doc-tabs");
const docFrame = document.getElementById("doc-frame");
const docOpen = document.getElementById("doc-open");

function showDoc(folder, key) {
  const src = folder + "/" + key + ".pdf";
  // 도구 막대 · 미리보기 칸 숨기고 가로 폭에 맞추기 (크롬 · 엣지)
  docFrame.src = src + "#toolbar=0&navpanes=0&view=FitH";
  docOpen.href = src; // "새 탭에서 크게 보기" 주소
  docTabs.querySelectorAll(".doc-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.key === key));
}

document.querySelectorAll(".js-docs").forEach((btn) => {
  btn.addEventListener("click", () => {
    const folder = btn.dataset.folder;
    const keys = btn.dataset.docs.split(",").map((k) => k.trim());
    docTitle.textContent = btn.dataset.title;
    docTabs.innerHTML = "";
    keys.forEach((key) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "doc-tab";
      tab.dataset.key = key;
      tab.textContent = docLabel(key, btn.textContent.trim());
      tab.addEventListener("click", () => showDoc(folder, key));
      docTabs.appendChild(tab);
    });
    showDoc(folder, keys[0]);
    docPopup.showModal();
  });
});

// 닫기 버튼 · 바깥 클릭 · ESC로 닫기 (닫힐 때 PDF 비우기)
document.getElementById("doc-close").addEventListener("click", () => docPopup.close());
docPopup.addEventListener("click", (e) => {
  if (e.target === docPopup) docPopup.close();
});
docPopup.addEventListener("close", () => {
  docFrame.src = "";
});
