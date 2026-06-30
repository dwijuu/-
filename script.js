// 탭 전환 제어 엔진
function openTab(evt, tabName) {
    let tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) { tabContents[i].style.display = "none"; }
    let tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) { tabBtns[i].className = tabBtns[i].className.replace(" active", ""); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    if (tabName === 'tab-gallery') { renderAll(); }
}

// 가상 데이터베이스 아카이브
let characters = [];
let groups = [];
let currentOpenId = null;
let currentOpenType = 'char';

let targetEditPhotoId = null;
let activeTagFilter = "전체";

// 📸 이미지를 텍스트 데이터로 변환하는 영구 저장 핵심 함수
function fileToBase64(file) {
    return new Promise((resolve) => {
        if (!file) { resolve(null); return; }
        let reader = new FileReader();
        reader.onload = function (e) { resolve(e.target.result); };
        reader.readAsDataURL(file);
    });
}

// 캐릭터 신규 등록 연산 공정 (비동기 처리 적용)
async function addCharacter() {
    let name = document.getElementById("name").value.trim();
    let gender = document.getElementById("gender").value;
    let mbti = document.getElementById("mbti").value;
    let race = document.getElementById("race").value;
    let magic1 = document.getElementById("magic1").value;
    let magic2 = document.getElementById("magic2").value;
    let avatarFile = document.getElementById("avatar").files[0];

    if (name === "") { alert("이름을 입력해주세요!"); return; }

    // 사진을 영구적인 텍스트 주소로 변환
    let avatarUrl = await fileToBase64(avatarFile);

    let newChar = {
        id: "char_" + Date.now() + "_" + Math.random(),
        name: name,
        gender: gender,
        mbti: mbti,
        race: race,
        magic1: magic1,
        magic2: magic2,
        avatarUrl: avatarUrl,
        photos: [],

        profile: {
            age: "", height: "",
            specRace: race, specElement: (magic1 + " · " + magic2),
            appearance: "", clothing: "", wand: "", skills: "",
            personality: "", likesDislikes: "", background: "",
            strengths: "", weaknesses: "", etc: ""
        }
    };

    characters.push(newChar);
    renderAll();

    document.getElementById("name").value = "";
    document.getElementById("avatar").value = "";
}

function deleteCharacter(id) {
    if (confirm("이 캐릭터를 삭제하시겠습니까? 관련 그림도 모두 사라집니다.")) {
        characters = characters.filter(char => char.id !== id);
        // 연관된 그룹 초기화 처리 등을 위해 리렌더링
        groups.forEach(g => {
            g.charIds = g.charIds.filter(cid => cid !== id);
        });
        groups = groups.filter(g => g.charIds.length > 0);
        renderAll();
    }
}

function adjustTextAreaHeight(element) {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
}

let currentProfileCharId = null;

// 캐릭터 설정 팝업 오픈 및 바인딩
function openCharProfile(id) {
    currentProfileCharId = id;
    let char = characters.find(c => c.id === id);
    if (!char) return;

    let avatarDiv = document.getElementById("profile-fixed-avatar");
    if (char.avatarUrl) {
        avatarDiv.innerHTML = `<img src="${char.avatarUrl}">`;
    } else {
        avatarDiv.innerHTML = "👤";
    }

    document.getElementById("prof-name").value = char.name;
    document.getElementById("prof-gender").value = char.gender;

    let p = char.profile;
    document.getElementById("prof-age").value = p.age || "";
    document.getElementById("prof-height").value = p.height || "";
    document.getElementById("prof-race").value = p.specRace || char.race;
    document.getElementById("prof-element").value = p.specElement || (char.magic1 + " · " + char.magic2);
    document.getElementById("prof-appearance").value = p.appearance || "";
    document.getElementById("prof-clothing").value = p.clothing || "";
    document.getElementById("prof-wand").value = p.wand || "";
    document.getElementById("prof-skills").value = p.skills || "";
    document.getElementById("prof-personality").value = p.personality || "";
    document.getElementById("prof-likes-dislikes").value = p.likesDislikes || "";
    document.getElementById("prof-background").value = p.background || "";
    document.getElementById("prof-strengths").value = p.strengths || "";
    document.getElementById("prof-weaknesses").value = p.weaknesses || "";
    document.getElementById("prof-etc").value = p.etc || "";

    document.getElementById("char-profile-modal").style.display = "flex";

    setTimeout(() => {
        let textareas = document.querySelectorAll(".dynamic-field-block textarea");
        textareas.forEach(ta => adjustTextAreaHeight(ta));
        document.querySelector(".profile-main-right-scroll").scrollTop = 0;
    }, 50);
}

function closeCharProfileModal() {
    document.getElementById("char-profile-modal").style.display = "none";
    currentProfileCharId = null;
}

// 설정 필드 저장
function saveCharProfile() {
    if (!currentProfileCharId) return;
    let char = characters.find(c => c.id === currentProfileCharId);
    if (!char) return;

    char.name = document.getElementById("prof-name").value.trim();
    char.gender = document.getElementById("prof-gender").value.trim();

    char.profile.age = document.getElementById("prof-age").value;
    char.profile.height = document.getElementById("prof-height").value;
    char.profile.specRace = document.getElementById("prof-race").value;
    char.profile.specElement = document.getElementById("prof-element").value;
    char.profile.appearance = document.getElementById("prof-appearance").value;
    char.profile.clothing = document.getElementById("prof-clothing").value;
    char.profile.wand = document.getElementById("prof-wand").value;
    char.profile.skills = document.getElementById("prof-skills").value;
    char.profile.personality = document.getElementById("prof-personality").value;
    char.profile.likesDislikes = document.getElementById("prof-likes-dislikes").value;
    char.profile.background = document.getElementById("prof-background").value;
    char.profile.strengths = document.getElementById("prof-strengths").value;
    char.profile.weaknesses = document.getElementById("prof-weaknesses").value;
    char.profile.etc = document.getElementById("prof-etc").value;

    alert("설정이 저장되었습니다!");
    closeCharProfileModal();
    renderAll();
}

// 📤 캐릭터 데이터 파일로 다운로드 (개인 컴퓨터 저장)
function exportCharacter(id) {
    let char = characters.find(c => c.id === id);
    if (!char) return;

    // 파일 이름 생성을 위해 공백 유효성 처리
    let fileName = `${char.name}_설정데이터.json`;

    // JSON 문자열 변환 및 다운로드 링크 활성화
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// 📥 파일 읽어서 데이터베이스에 로드 (다른 사람 파일 불러오기)
function importCharacter(input) {
    let file = input.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function (e) {
        try {
            let importedChar = JSON.parse(e.target.result);

            // 필수 검증 (기본 구조 확인)
            if (!importedChar.name || !importedChar.id || !importedChar.profile) {
                alert("올바른 캐릭터 설정 파일이 아닙니다.");
                return;
            }

            // ID 중복 방지를 위한 새 식별값 할당 (기존 데이터 덮어쓰기 방지)
            importedChar.id = "char_" + Date.now() + "_" + Math.random();

            characters.push(importedChar);
            renderAll();
            alert(`${importedChar.name} 캐릭터 설정을 성공적으로 불러왔습니다!`);
        } catch (err) {
            alert("파일을 읽는 중 오류가 발생했습니다.");
        }
    };
    reader.readAsText(file);
    input.value = ""; // 입력창 초기화
}

// -------------------------------------------------------------
// 이하 기존 갤러리 및 종합 렌더링 시스템 유지 보완
// -------------------------------------------------------------

function renderAll() {
    // 3대 종족 리스트 리셋 및 정렬
    document.getElementById("list-human").innerHTML = "";
    document.getElementById("list-white").innerHTML = "";
    document.getElementById("list-black").innerHTML = "";

    characters.forEach(char => {
        let card = document.createElement("div");
        card.className = "char-card";

        let avatarContent = char.avatarUrl ? `<img src="${char.avatarUrl}">` : "👤";

        card.innerHTML = `
            <button class="close-btn" onclick="deleteCharacter('${char.id}')">×</button>
            <div class="char-avatar">${avatarContent}</div>
            <div class="char-info">
                <h3>${char.name}</h3>
                <p>성별: ${char.gender} | MBTI: ${char.mbti}</p>
                <p>원소: ${char.magic1} / ${char.magic2}</p>
                <div class="char-card-buttons">
                    <button class="card-setup-btn" onclick="openCharProfile('${char.id}')">🛠️ 설정</button>
                    <button class="card-export-btn" onclick="exportCharacter('${char.id}')">📤 내보내기</button>
                </div>
            </div>
        `;

        if (char.race === "인간") document.getElementById("list-human").appendChild(card);
        else if (char.race === "화이트") document.getElementById("list-white").appendChild(card);
        else if (char.race === "블랙") document.getElementById("list-black").appendChild(card);
    });

    renderCombinedGalleryList();
    renderRecentPhotos();
}

function renderCombinedGalleryList() {
    let container = document.getElementById("combined-gallery-list");
    if (!container) return;
    container.innerHTML = "";

    // 1. 캐릭터 리스트 추가
    characters.forEach(char => {
        let card = document.createElement("div");
        card.className = "gallery-large-card";
        let avatarContent = char.avatarUrl ? `<img src="${char.avatarUrl}">` : "👤";
        card.innerHTML = `
            <div class="char-avatar">${avatarContent}</div>
            <p class="char-name">${char.name}</p>
            <button class="gallery-open-btn" onclick="openGallery('${char.id}', 'char')">📂 갤러리 열기 (${char.photos.length})</button>
        `;
        container.appendChild(card);
    });

    // 2. 그룹 리스트 추가
    groups.forEach(group => {
        let card = document.createElement("div");
        card.className = "gallery-large-card group-card";
        card.innerHTML = `
            <button class="group-del-btn" onclick="deleteGroup('${group.id}')">×</button>
            <div class="char-avatar">👥</div>
            <p class="char-name">${group.name}</p>
            <button class="gallery-open-btn" onclick="openGallery('${group.id}', 'group')">📂 그룹 열기 (${getGroupPhotosCount(group)})</button>
        `;
        container.appendChild(card);
    });
}

function getGroupPhotosCount(group) {
    let count = 0;
    group.charIds.forEach(cid => {
        let char = characters.find(c => c.id === cid);
        if (char) count += char.photos.length;
    });
    return count;
}

function openGallery(id, type) {
    currentOpenId = id;
    currentOpenType = type;

    let modal = document.getElementById("gallery-modal");
    let title = document.getElementById("modal-char-name");

    if (type === 'char') {
        let char = characters.find(c => c.id === id);
        if (char) title.innerText = `📂 ${char.name} 캐릭터 개인 갤러리`;
        document.querySelector(".photo-upload-panel").style.display = "flex";
    } else {
        let group = groups.find(g => g.id === id);
        if (group) title.innerText = `👥 ${group.name} 그룹 통합 갤러리`;
        // 그룹 상태에서는 개별 사진 다이렉트 업로드 금지 (캐릭터 방에서 올려야 함)
        document.querySelector(".photo-upload-panel").style.display = "none";
    }

    renderPopupPhotoGrid();
    modal.style.display = "flex";
}

function closeGallery() {
    document.getElementById("gallery-modal").style.display = "none";
    document.getElementById("photo-title").value = "";
    document.getElementById("photo-tags").value = "";
    document.getElementById("photo-file").value = "";
    document.getElementById("file-preview-zone").style.display = "none";
}

function previewGalleryImage(input) {
    let file = input.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("file-preview-img").src = e.target.result;
            document.getElementById("file-preview-zone").style.display = "flex";
        };
        reader.readAsDataURL(file);
    }
}

async function addPhotoToGallery() {
    if (currentOpenType !== 'char') return;
    let char = characters.find(c => c.id === currentOpenId);
    if (!char) return;

    let titleInput = document.getElementById("photo-title").value.trim();
    let tagsInput = document.getElementById("photo-tags").value.trim();
    let fileInput = document.getElementById("photo-file").files[0];

    if (!fileInput) { alert("그림 파일을 선택해주세요!"); return; }
    let title = titleInput === "" ? "무제" : titleInput;

    // 태그 포맷 가공 (# 기호 붙이기)
    let tags = [];
    if (tagsInput !== "") {
        tags = tagsInput.split(/\s+/).map(t => t.startsWith('#') ? t : '#' + t);
    }

    let imgUrl = await fileToBase64(fileInput);

    let newPhoto = {
        id: "photo_" + Date.now() + "_" + Math.random(),
        title: title,
        tags: tags,
        url: imgUrl,
        timestamp: Date.now()
    };

    char.photos.push(newPhoto);

    document.getElementById("photo-title").value = "";
    document.getElementById("photo-tags").value = "";
    document.getElementById("photo-file").value = "";
    document.getElementById("file-preview-zone").style.display = "none";

    renderPopupPhotoGrid();
    renderAll();
}

function renderPopupPhotoGrid() {
    let grid = document.getElementById("popup-photo-grid");
    grid.innerHTML = "";

    let photosToShow = [];

    if (currentOpenType === 'char') {
        let char = characters.find(c => c.id === currentOpenId);
        if (char) photosToShow = char.photos;
    } else {
        let group = groups.find(g => g.id === currentOpenId);
        if (group) {
            group.charIds.forEach(cid => {
                let char = characters.find(c => c.id === cid);
                if (char) {
                    char.photos.forEach(p => {
                        photosToShow.push({ ...p, charName: char.name });
                    });
                }
            });
            photosToShow.sort((a, b) => b.timestamp - a.timestamp);
        }
    }

    if (photosToShow.length === 0) {
        grid.innerHTML = `<p class="empty-text">등록된 그림이 없습니다.</p>`;
        return;
    }

    photosToShow.forEach(p => {
        let card = document.createElement("div");
        card.className = "popup-photo-card";

        let titleDisplay = p.charName ? `[${p.charName}] ${p.title}` : p.title;
        let tagsDisplay = p.tags.length > 0 ? p.tags.join(" ") : "태그 없음";

        // 캐릭터 개별 소유 갤러리일 때만 자체 삭제/편집 기능 제공
        let actionButtons = "";
        if (currentOpenType === 'char') {
            actionButtons = `
                <button class="photo-del-btn" onclick="deletePhoto('${p.id}')">×</button>
                <div class="photo-action-bar">
                    <button class="btn-zoom" onclick="zoomPhoto('${p.url}', '${p.title}')">🔍 확대</button>
                    <button class="btn-edit" onclick="openPhotoEditModal('${p.id}')">📝 수정</button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="photo-action-bar">
                    <button class="btn-zoom" onclick="zoomPhoto('${p.url}', '${p.title}')" style="grid-column: span 2;">🔍 원본 확대보기</button>
                </div>
            `;
        }

        card.innerHTML = `
            <img src="${p.url}">
            <p>${titleDisplay}</p>
            <div class="photo-tags-display">${tagsDisplay}</div>
            ${actionButtons}
        `;
        grid.appendChild(card);
    });
}

function deletePhoto(photoId) {
    if (confirm("이 그림을 삭제하시겠습니까?")) {
        let char = characters.find(c => c.id === currentOpenId);
        if (char) {
            char.photos = char.photos.filter(p => p.id !== photoId);
            renderPopupPhotoGrid();
            renderAll();
        }
    }
}

// 원본 확대 모달 처리 엔진
function zoomPhoto(url, title) {
    document.getElementById("zoom-target-img").src = url;
    document.getElementById("zoom-target-title").innerText = title;
    document.getElementById("zoom-modal").style.display = "flex";
}
function closeZoomPhoto() {
    document.getElementById("zoom-modal").style.display = "none";
}

// 사후 편집창 제어
function openPhotoEditModal(photoId) {
    targetEditPhotoId = photoId;
    let char = characters.find(c => c.id === currentOpenId);
    if (!char) return;
    let photo = char.photos.find(p => p.id === photoId);
    if (!photo) return;

    document.getElementById("edit-photo-title").value = photo.title;
    document.getElementById("edit-photo-tags").value = photo.tags.join(" ");
    document.getElementById("photo-edit-modal").style.display = "flex";
}
function closePhotoEditModal() {
    document.getElementById("photo-edit-modal").style.display = "none";
    targetEditPhotoId = null;
}
function submitEditPhoto() {
    let char = characters.find(c => c.id === currentOpenId);
    if (!char || !targetEditPhotoId) return;
    let photo = char.photos.find(p => p.id === targetEditPhotoId);
    if (!photo) return;

    let newTitle = document.getElementById("edit-photo-title").value.trim();
    let newTagsInput = document.getElementById("edit-photo-tags").value.trim();

    photo.title = newTitle === "" ? "무제" : newTitle;
    if (newTagsInput === "") {
        photo.tags = [];
    } else {
        photo.tags = newTagsInput.split(/\s+/).map(t => t.startsWith('#') ? t : '#' + t);
    }

    closePhotoEditModal();
    renderPopupPhotoGrid();
    renderAll();
}

// 그룹 생성 처리엔진
function openGroupCreationModal() {
    let listDiv = document.getElementById("group-clickable-list");
    listDiv.innerHTML = "";

    if (characters.length === 0) {
        listDiv.innerHTML = `<p class="empty-text">먼저 명단에서 캐릭터를 추가해주세요!</p>`;
    }

    characters.forEach(char => {
        let item = document.createElement("div");
        item.className = "group-box-item";
        item.innerText = char.name;
        item.dataset.id = char.id;
        item.onclick = function () {
            this.classList.toggle("selected");
        };
        listDiv.appendChild(item);
    });

    document.getElementById("group-modal").style.display = "flex";
}
function closeGroupCreationModal() {
    document.getElementById("group-modal").style.display = "none";
}
function submitCreateGroup() {
    let selectedElements = document.querySelectorAll(".group-box-item.selected");
    if (selectedElements.length === 0) { alert("그룹에 포함할 캐릭터를 선택하세요."); return; }

    let charIds = Array.from(selectedElements).map(el => el.dataset.id);
    let names = Array.from(selectedElements).map(el => el.innerText);

    let groupName = names.join(", ");
    if (groupName.length > 25) groupName = groupName.substring(0, 22) + "...";

    let newGroup = {
        id: "group_" + Date.now(),
        name: "👥 " + groupName + " 방",
        charIds: charIds
    };

    groups.push(newGroup);
    closeGroupCreationModal();
    renderAll();
}
function deleteGroup(id) {
    if (confirm("이 그룹 갤러리를 폭파하시겠습니까? (원본 캐릭터 데이터는 안전합니다)")) {
        groups = groups.filter(g => g.id !== id);
        renderAll();
    }
}

// 타임라인용 대시보드 렌더링
function renderRecentPhotos() {
    let container = document.getElementById("recent-photos-container");
    container.innerHTML = "";

    let allPhotos = [];
    characters.forEach(char => {
        char.photos.forEach(p => {
            allPhotos.push({ ...p, charName: char.name });
        });
    });

    allPhotos.sort((a, b) => b.timestamp - a.timestamp);
    let recent = allPhotos.slice(0, 3);

    if (recent.length === 0) {
        container.innerHTML = `<p class="empty-text">아직 추가된 그림이 없습니다.</p>`;
        return;
    }

    recent.forEach(p => {
        let card = document.createElement("div");
        card.className = "recent-card";
        card.innerHTML = `
            <img src="${p.url}">
            <div class="recent-title-container">
                <span>[${p.charName}] ${p.title}</span>
                <button class="recent-zoom-icon-btn" onclick="zoomPhoto('${p.url}', '${p.title}')">🔍</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// [통합 모아보기 모달] 제어 파트
function openAllPhotosModal() {
    activeTagFilter = "전체";
    renderAllPhotosPopupGrid();
    document.getElementById("all-photos-modal").style.display = "flex";
}
function closeAllPhotosModal() {
    document.getElementById("all-photos-modal").style.display = "none";
}
function renderAllPhotosPopupGrid() {
    let grid = document.getElementById("all-photos-popup-grid");
    let tagBar = document.getElementById("all-photos-tag-bar");
    grid.innerHTML = "";
    tagBar.innerHTML = "";

    let allPhotos = [];
    let tagCounts = {};

    characters.forEach(char => {
        char.photos.forEach(p => {
            allPhotos.push({ ...p, charName: char.name });
            p.tags.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        });
    });

    // 태그 바 필터링 버튼 생성
    let totalBtn = document.createElement("button");
    totalBtn.className = "filter-tag-btn" + (activeTagFilter === "전체" ? " active" : "");
    totalBtn.innerText = `전체 (${allPhotos.length})`;
    totalBtn.onclick = function () { activeTagFilter = "전체"; renderAllPhotosPopupGrid(); };
    tagBar.appendChild(totalBtn);

    Object.keys(tagCounts).forEach(tag => {
        let btn = document.createElement("button");
        btn.className = "filter-tag-btn" + (activeTagFilter === tag ? " active" : "");
        btn.innerText = `${tag} (${tagCounts[tag]})`;
        btn.onclick = function () { activeTagFilter = tag; renderAllPhotosPopupGrid(); };
        tagBar.appendChild(btn);
    });

    // 데이터 필터링 가공
    let filteredPhotos = allPhotos;
    if (activeTagFilter !== "전체") {
        filteredPhotos = allPhotos.filter(p => p.tags.includes(activeTagFilter));
    }
    filteredPhotos.sort((a, b) => b.timestamp - a.timestamp);

    if (filteredPhotos.length === 0) {
        grid.innerHTML = `<p class="empty-text">해당하는 그림이 없습니다.</p>`;
        return;
    }

    filteredPhotos.forEach(p => {
        let card = document.createElement("div");
        card.className = "popup-photo-card";
        card.innerHTML = `
            <img src="${p.url}">
            <p>[${p.charName}] ${p.title}</p>
            <div class="photo-tags-display">${p.tags.join(" ")}</div>
            <div class="photo-action-bar">
                <button class="btn-zoom" onclick="zoomPhoto('${p.url}', '${p.title}')" style="grid-column: span 2;">🔍 확대보기</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 윈도우 최초 실행 시 가동
window.onload = function () {
    renderAll();
};