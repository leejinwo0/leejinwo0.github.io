// ---------------------------------------------------------
// 1. 푸터에 올해 연도 자동 표시
// ---------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------------------------------------------------------
// 2. 스크롤 위치에 맞춰 사이드바 메뉴 강조
//    화면 가운데쯤 들어온 섹션의 메뉴에 'active' 클래스를 붙입니다.
// ---------------------------------------------------------

// '#'으로 시작하는 메뉴 링크만 가져오기
const links = document.querySelectorAll('.nav-link[href^="#"]');

// 각 메뉴가 가리키는 섹션 요소 찾기
const sections = [...links].map((link) =>
  document.querySelector(link.getAttribute("href")),
);

const nav = document.querySelector(".nav");

// 아이디가 id인 섹션의 메뉴만 강조
function setActive(id) {
  links.forEach((link) => {
    const on = link.getAttribute("href") === "#" + id;
    link.classList.toggle("active", on);

    // 모바일 가로 메뉴: 강조된 메뉴가 가운데 오도록 메뉴 줄을 자동으로 밀기
    // (PC 세로 메뉴에서는 가로로 넘칠 일이 없어서 아무 변화 없음)
    if (on) {
      nav.scrollTo({
        left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2,
        behavior: "smooth",
      });
    }
  });
}

// IntersectionObserver: 요소가 화면에 들어왔는지 감시하는 브라우저 기능
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  },
  // 화면 위 30% ~ 아래 60%를 뺀 가운데 띠에 들어오면 '보고 있는 섹션'으로 판단
  { rootMargin: "-30% 0px -60% 0px" },
);

sections.forEach((section) => {
  if (section) observer.observe(section);
});

// 처음 열었을 때는 첫 섹션(학력)을 강조
setActive("education");

// ---------------------------------------------------------
// 3. GitHub · 이메일 주소 팝업
//    .js-popup 버튼을 누르면 data-title, data-value 값을 팝업에 넣고 띄웁니다.
// ---------------------------------------------------------
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupValue = document.getElementById("popup-value");
const copyBtn = document.getElementById("popup-copy");

document.querySelectorAll(".js-popup").forEach((btn) => {
  btn.addEventListener("click", () => {
    popupTitle.textContent = btn.dataset.title;
    popupValue.textContent = btn.dataset.value;
    copyBtn.textContent = "복사";
    popup.showModal(); // 화면 가운데에 팝업 열기 (ESC로도 닫힘)
  });
});

// 복사 버튼: 주소를 클립보드에 복사
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(popupValue.textContent);
    copyBtn.textContent = "복사됨";
  } catch {
    copyBtn.textContent = "직접 선택해 복사해주세요";
  }
});

// 닫기 버튼
document
  .getElementById("popup-close")
  .addEventListener("click", () => popup.close());

// 팝업 바깥(어두운 배경)을 눌러도 닫기
popup.addEventListener("click", (e) => {
  if (e.target === popup) popup.close();
});

// ---------------------------------------------------------
// 4. 프로젝트 문서 미리보기 팝업
//    .js-docs 버튼의 data-docs 목록으로 탭을 만들고,
//    고른 탭의 PDF를 팝업 안 iframe에 띄웁니다.
//    PDF 파일 위치 = data-folder + "/" + 문서이름 + ".pdf"
// ---------------------------------------------------------

// 파일 이름 → 탭에 보일 이름
const DOC_NAMES = {
  plan: "수행계획서",
  report: "결과보고서",
  design: "화면설계서",
  summary: "프로젝트정리",
};

const docPopup = document.getElementById("doc-popup");
const docTitle = document.getElementById("doc-title");
const docTabs = document.getElementById("doc-tabs");
const docFrame = document.getElementById("doc-frame");
const docOpen = document.getElementById("doc-open");

// 문서 하나를 골라 보여주기
function showDoc(folder, key) {
  const src = folder + "/" + key + ".pdf";
  docFrame.src = src; // 팝업 안에 PDF 표시
  docOpen.href = src; // "새 탭에서 크게 보기" 주소

  // 고른 탭만 검정으로 강조
  docTabs.querySelectorAll(".doc-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.key === key);
  });
}

// 문서 버튼을 누르면 팝업 열기
document.querySelectorAll(".js-docs").forEach((btn) => {
  btn.addEventListener("click", () => {
    const folder = btn.dataset.folder;
    const keys = btn.dataset.docs.split(",").map((k) => k.trim());

    docTitle.textContent = btn.dataset.title;

    // 있는 문서만 탭 버튼으로 만들기
    docTabs.innerHTML = "";
    keys.forEach((key) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "doc-tab";
      tab.dataset.key = key;
      tab.textContent = DOC_NAMES[key] || key;
      tab.addEventListener("click", () => showDoc(folder, key));
      docTabs.appendChild(tab);
    });

    showDoc(folder, keys[0]); // 첫 번째 문서부터 보여주기
    docPopup.showModal();
  });
});

// 닫기 버튼
document
  .getElementById("doc-close")
  .addEventListener("click", () => docPopup.close());

// 팝업 바깥(어두운 배경)을 눌러도 닫기
docPopup.addEventListener("click", (e) => {
  if (e.target === docPopup) docPopup.close();
});

// 닫힐 때 PDF를 비워서 메모리 정리 (ESC로 닫을 때도 실행)
docPopup.addEventListener("close", () => {
  docFrame.src = "";
});
