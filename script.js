// ---------------------------------------------------------
// 1. 푸터에 올해 연도 자동 표시
// ---------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------------------------------------------------------
// 2. 사이드바 메뉴: 항목 개수 표시 + 스크롤 위치에 맞춰 강조
//    지금 보고 있는 섹션의 메뉴에 'active' 클래스를 붙입니다.
// ---------------------------------------------------------

// '#'으로 시작하는 메뉴 링크 가져오기
const links = document.querySelectorAll('.nav-link[href^="#"]');

// 각 메뉴가 가리키는 섹션 요소 찾기
const sections = [...links].map((link) =>
    document.querySelector(link.getAttribute("href")),
);

// 사이드바 숫자 자동 채우기: 각 섹션 안의 항목(.row) 개수를 세서 표시
links.forEach((link, i) => {
    const section = sections[i];
    const count = link.querySelector(".count");
    if (section && count) {
        count.textContent = section.querySelectorAll(".row").length;
    }
});

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
                left:
                    link.offsetLeft -
                    nav.clientWidth / 2 +
                    link.clientWidth / 2,
                behavior: "smooth",
            });
        }
    });
}

// 지금 보고 있는 섹션 찾기
// 화면 위에서 OFFSET(px) 지점을 이미 지나간 섹션 중 가장 아래 것을 '보고 있는 섹션'으로 판단
const OFFSET = 120;
let lockUntil = 0; // 메뉴 클릭 직후 잠깐 자동 판단을 멈추는 시각

function updateActive() {
    if (Date.now() < lockUntil) return; // 클릭으로 이동하는 중이면 건너뛰기

    let current = sections[0];
    sections.forEach((section) => {
        if (section && section.getBoundingClientRect().top - OFFSET <= 0) {
            current = section;
        }
    });

    // 페이지 맨 아래에 닿으면 마지막 섹션(자격증)을 강조
    const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
    if (atBottom) current = sections[sections.length - 1];

    setActive(current.id);
}

// 스크롤할 때마다 확인 (requestAnimationFrame으로 너무 자주 실행되지 않게)
let ticking = false;
window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        updateActive();
        ticking = false;
    });
});

// 메뉴를 클릭하면 누른 메뉴를 바로 강조하고,
// 부드럽게 스크롤되는 동안(1초)은 자동 판단을 멈춰서 다른 메뉴로 바뀌지 않게
links.forEach((link) => {
    link.addEventListener("click", () => {
        setActive(link.getAttribute("href").slice(1));
        lockUntil = Date.now() + 1000;
    });
});

// 처음 열었을 때 현재 위치에 맞게 강조
updateActive();

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
// 4. 문서 미리보기 팝업 (증명서 · 프로젝트 문서 · 수료증 · 이수증 · 상장 · 자격증 공용)
//    .js-docs 버튼의 data-docs 목록으로 탭을 만들고,
//    고른 탭의 PDF를 팝업 안 iframe에 띄웁니다.
//    PDF 파일 위치 = data-folder + "/" + 문서이름 + ".pdf"
// ---------------------------------------------------------

// 문서종류(파일 이름 맨 끝) → 탭에 보일 이름
// 예) 20250802-sejong-dx-hackathon-award → "award" → 상장
const DOC_TYPES = {
    graduation: "졸업증명서",
    transcript: "성적증명서",
    "military-record": "병적증명서",
    employment: "재직증명서",
    plan: "수행계획서",
    report: "결과보고서",
    design: "화면설계서",
    summary: "프로젝트정리",
    completion: "수료증",
    certificate: "이수증",
    award: "상장",
    qualification: "자격증",
};

// 파일 이름 끝의 문서종류를 찾아 탭 이름 돌려주기 (못 찾으면 버튼 글자)
function docLabel(file, fallback) {
    const type = Object.keys(DOC_TYPES).find((t) => file.endsWith("-" + t));
    return type ? DOC_TYPES[type] : fallback;
}

const docPopup = document.getElementById("doc-popup");
const docTitle = document.getElementById("doc-title");
const docTabs = document.getElementById("doc-tabs");
const docFrame = document.getElementById("doc-frame");
const docOpen = document.getElementById("doc-open");

// 문서 하나를 골라 보여주기
function showDoc(folder, key) {
    const src = folder + "/" + key + ".pdf";
    // #toolbar=0 : 위쪽 도구 막대 숨기기 · &navpanes=0 : 왼쪽 미리보기 칸 숨기기
    // &view=FitH : 페이지를 팝업 가로 폭에 맞추기 (크롬 · 엣지에서 적용)
    docFrame.src = src + "#toolbar=0&navpanes=0&view=FitH"; // 팝업 안에 PDF 표시
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
            tab.textContent = docLabel(key, btn.textContent.trim());
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

// ---------------------------------------------------------
// 5. 라이트 · 다크 모드 전환
//    <html data-theme="light | dark"> 값을 바꾸면 style.css의 색상 변수가 바뀝니다.
//    고른 테마는 브라우저에 저장해서 다음에 와도 유지됩니다.
// ---------------------------------------------------------
const themeBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// 지금 테마에 맞게 스위치 상태 · 아이콘 바꾸기
// (라이트 = 꺼짐 · 해 아이콘, 다크 = 켜짐 · 달 아이콘)
function syncThemeButton() {
    const dark = document.documentElement.dataset.theme === "dark";
    themeBtn.setAttribute("aria-checked", dark ? "true" : "false");
    themeIcon.src = dark ? "icons/moon.svg" : "icons/sun.svg";
}

themeBtn.addEventListener("click", () => {
    const next =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
        localStorage.setItem("theme", next); // 선택 기억하기
    } catch (e) {}
    syncThemeButton();
});

syncThemeButton(); // 처음 열었을 때 아이콘 맞추기
