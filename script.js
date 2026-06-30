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

// 캐릭터 신규 등록 연산 공정
function addCharacter() {
    let name = document.getElementById("name").value.trim();
    let gender = document.getElementById("gender").value;
    let mbti = document.getElementById("mbti").value;
    let race = document.getElementById("race").value;
    let magic1 = document.getElementById("magic1").value;
    let magic2 = document.getElementById("magic2").value;
    let avatarFile = document.getElementById("avatar").value ? document.getElementById("avatar").files[0] : null;

    if (name === "") { alert("이름을 입력해주세요!"); return; }

    let avatarUrl = null;
    if (avatarFile) { avatarUrl = URL.createObjectURL(avatarFile); }

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

        // 상세 확장 도감 데이터 초기 스키마 정의
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
    characters = characters.filter(char => char.id !== id);
    renderAll();
}

// 글자수에 맞춰 인풋 상자 크기 실시간 조절 스크립트
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

    // 왼쪽 네모 형태 아바타 상자 로드
    let avatarDiv = document.getElementById("profile-fixed-avatar");
    if (char.avatarUrl) {
        avatarDiv.innerHTML = `<img src="${char.avatarUrl}">`;
    } else {
        avatarDiv.innerHTML = "👤";
    }

    // 오른쪽 스크롤판 내부 필드 일괄 매핑 로드
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

    // 데이터 주입 직후 모든 인풋들의 높이를 초기화하여 텍스트에 맞게 가변 조절
    setTimeout(() => {
        let textareas = document.querySelectorAll(".dynamic-field-block textarea");
        textareas.forEach(ta => adjustTextAreaHeight(ta));

        // 스크롤바를 맨 상단으로 초기화
        document.querySelector(".profile-main-right-scroll").scrollTop = 0;
    }, 50);
}

function closeCharProfileModal() {
    document.getElementById("char-profile-modal").style.display = "none";
    currentProfileCharId = null;
}

// 입력 필드 세이브 연산 로직
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

    alert(`✨ ${char.name}의 상세 설정이 저장되었습니다.`);
    closeCharProfileModal();
    renderAll();
}

// 그룹 관리 모듈계
function openGroupCreationModal() {
    let listDiv = document.getElementById("group-clickable-list");
    listDiv.innerHTML = "";
    if (characters.length === 0) { alert("그룹에 추가할 캐릭터 명단이 없습니다."); return; }

    characters.forEach(char => {
        let item = document.createElement("div");
        item.className = "group-box-item";
        item.dataset.id = char.id;
        item.innerText = char.name;
        item.onclick = function () { this.classList.toggle("selected"); };
        listDiv.appendChild(item);
    });
    document.getElementById("group-modal").style.display = "flex";
}

function closeGroupCreationModal() { document.getElementById("group-modal").style.display = "none"; }

function submitCreateGroup() {
    let selectedItems = document.querySelectorAll(".group-box-item.selected");
    let selectedCharIds = []; let selectedNames = [];

    selectedItems.forEach(item => {
        let cid = item.dataset.id; selectedCharIds.push(cid);
        let found = characters.find(c => c.id === cid);
        if (found) selectedNames.push(found.name);
    });

    if (selectedCharIds.length < 2) { alert("그룹을 개설하려면 최소 2명 이상 선택해주세요!"); return; }

    let newGroup = {
        id: "group_" + Date.now() + "_" + Math.random(),
        name: selectedNames.join(", "),
        memberIds: selectedCharIds,
        photos: []
    };
    groups.push(newGroup);
    closeGroupCreationModal();
    renderAll();
}

function deleteGroup(id) {
    if (confirm("이 그룹 갤러리를 삭제하시겠습니까?")) { groups = groups.filter(g => g.id !== id); renderAll(); }
}

// 렌더링 총지휘부
function renderAll() {
    renderMainTab();
    renderCombinedGalleryList();
    renderRecentPhotos();
}

function renderMainTab() {
    let listHuman = document.getElementById("list-human");
    let listWhite = document.getElementById("list-white");
    let listBlack = document.getElementById("list-black");

    listHuman.innerHTML = ""; listWhite.innerHTML = ""; listBlack.innerHTML = "";

    characters.forEach(char => {
        let magicText = (char.magic1 === "없음" && char.magic2 === "없음") ? "없음" : `${char.magic1} · ${char.magic2}`;
        let avatarHTML = char.avatarUrl ? `<div class="char-avatar"><img src="${char.avatarUrl}"></div>` : `<div class="char-avatar">👤</div>`;

        // [★ 변경] 설정 정의 -> '설정' 문구 변경 및 축소 컴포넌트 탑재
        let cardHTML = `
            <div class="char-card">
                ${avatarHTML}
                <div class="char-info">
                    <h3>${char.name}</h3>
                    <p>${char.gender} · ${char.mbti} · ${char.race}</p>
                    <p>마법: ${magicText}</p>
                    <div class="char-card-buttons">
                        <button class="card-setup-btn" onclick="openCharProfile('${char.id}')">⚙️ 설정</button>
                    </div>
                </div>
                <button class="close-btn" onclick="deleteCharacter('${char.id}')">×</button>
            </div>
        `;

        if (char.race === "인간") listHuman.innerHTML += cardHTML;
        else if (char.race === "화이트") listWhite.innerHTML += cardHTML;
        else if (char.race === "블랙") listBlack.innerHTML += cardHTML;
    });
}

function renderCombinedGalleryList() {
    let container = document.getElementById("combined-gallery-list");
    container.innerHTML = "";
    if (characters.length === 0 && groups.length === 0) {
        container.innerHTML = `<p class="empty-text">등록된 명단이나 그룹이 없습니다.</p>`; return;
    }

    characters.forEach(char => {
        let avatarHTML = char.avatarUrl ? `<div class="char-avatar"><img src="${char.avatarUrl}"></div>` : `<div class="char-avatar">👤</div>`;
        let cardHTML = `
            <div class="gallery-large-card">
                ${avatarHTML}
                <p class="char-name"><span style="color: #3b82f6; font-size: 11px; display: block; margin-bottom: 2px;">👤 개인</span>${char.name}</p>
                <button class="gallery-open-btn" onclick="openGallery('${char.id}', 'char')">갤러리 열기</button>
            </div>
        `;
        container.appendChild(document.createRange().createContextualFragment(cardHTML));
    });

    groups.forEach(g => {
        let cardHTML = `
            <div class="gallery-large-card group-card">
                <button class="group-del-btn" onclick="deleteGroup('${g.id}')">×</button>
                <div class="char-avatar">👥</div>
                <p class="char-name"><span style="color: #a855f7; font-size: 11px; display: block; margin-bottom: 2px;">👥 그룹</span>${g.name}</p>
                <button class="gallery-open-btn" onclick="openGallery('${g.id}', 'group')">그룹 갤러리 열기</button>
            </div>
        `;
        container.appendChild(document.createRange().createContextualFragment(cardHTML));
    });
}

function openGallery(id, type) {
    currentOpenId = id; currentOpenType = type;
    let titleHeader = document.getElementById("modal-char-name");

    if (type === 'char') {
        let char = characters.find(c => c.id === id); if (!char) return;
        titleHeader.innerText = `🏰 ${char.name}의 개인 갤러리`;
    } else {
        let group = groups.find(g => g.id === id); if (!group) return;
        titleHeader.innerText = `🔮 [그룹] ${group.name} 갤러리`;
    }
    document.getElementById("gallery-modal").style.display = "flex";
    document.getElementById("photo-title").value = "";
    document.getElementById("photo-tags").value = "";
    document.getElementById("photo-file").value = "";
    resetPreviewZone(); renderPopupPhotos();
}

function closeGallery() { document.getElementById("gallery-modal").style.display = "none"; currentOpenId = null; }

function renderPopupPhotos() {
    let gridDiv = document.getElementById("popup-photo-grid");
    gridDiv.innerHTML = "";
    let targetData = (currentOpenType === 'char') ? characters.find(c => c.id === currentOpenId) : groups.find(g => g.id === currentOpenId);
    if (!targetData || targetData.photos.length === 0) {
        gridDiv.innerHTML = `<p class="empty-text" style="grid-column: span 3; padding: 50px 0;">등록된 그림이 없습니다.</p>`; return;
    }

    targetData.photos.forEach(photo => {
        let displayTags = (photo.tags && photo.tags.length > 0) ? photo.tags.join(" ") : "";
        let photoCard = `
            <div class="popup-photo-card">
                <img src="${photo.url}">
                <p>${photo.title}</p>
                <div class="photo-tags-display">${displayTags}</div>
                <div class="photo-action-bar">
                    <button class="btn-save" onclick="downloadPhoto('${photo.url}', '${photo.title}')">💾 저장</button>
                    <button class="btn-zoom" onclick="zoomPhoto('${photo.url}', '${photo.title}')">🔍 크게보기</button>
                    <button class="btn-edit" onclick="openPhotoEditModal('${photo.id}')">⚙️ 설정</button>
                </div>
                <button class="photo-del-btn" onclick="deletePhotoFromGallery('${photo.id}')">×</button>
            </div>
        `;
        gridDiv.innerHTML += photoCard;
    });
}

function openPhotoEditModal(photoId) {
    targetEditPhotoId = photoId;
    let targetData = (currentOpenType === 'char') ? characters.find(c => c.id === currentOpenId) : groups.find(g => g.id === currentOpenId);
    if (!targetData) return;
    let photo = targetData.photos.find(p => p.id === photoId);
    if (!photo) return;

    document.getElementById("edit-photo-title").value = photo.title;
    document.getElementById("edit-photo-tags").value = (photo.tags) ? photo.tags.join(" ") : "";
    document.getElementById("photo-edit-modal").style.display = "flex";
}

function closePhotoEditModal() { document.getElementById("photo-edit-modal").style.display = "none"; targetEditPhotoId = null; }

function submitEditPhoto() {
    if (!targetEditPhotoId) return;
    let targetData = (currentOpenType === 'char') ? characters.find(c => c.id === currentOpenId) : groups.find(g => g.id === currentOpenId);
    if (!targetData) return;

    let photo = targetData.photos.find(p => p.id === targetEditPhotoId);
    if (photo) {
        let newTitle = document.getElementById("edit-photo-title").value.trim();
        let rawTags = document.getElementById("edit-photo-tags").value.trim();
        if (newTitle === "") { alert("그림 이름은 필수입니다."); return; }
        photo.title = newTitle;
        photo.tags = rawTags ? rawTags.split(/\s+/).map(t => t.startsWith('#') ? t : '#' + t) : [];
    }
    closePhotoEditModal(); renderPopupPhotos(); renderRecentPhotos();
}

function openAllPhotosModal() {
    activeTagFilter = "전체";
    document.getElementById("all-photos-modal").style.display = "flex";
    renderAllPhotosTagBar(); renderAllPhotosGrid();
}

function closeAllPhotosModal() { document.getElementById("all-photos-modal").style.display = "none"; }

function renderAllPhotosTagBar() {
    let bar = document.getElementById("all-photos-tag-bar"); bar.innerHTML = "";
    let tagSet = new Set();
    characters.forEach(c => c.photos.forEach(p => { if (p.tags) p.tags.forEach(t => tagSet.add(t)); }));
    groups.forEach(g => g.photos.forEach(p => { if (p.tags) p.tags.forEach(t => tagSet.add(t)); }));

    let btnAll = document.createElement("button");
    btnAll.className = `filter-tag-btn ${activeTagFilter === '전체' ? 'active' : ''}`;
    btnAll.innerText = "전체보기";
    btnAll.onclick = () => { activeTagFilter = "전체"; renderAllPhotosTagBar(); renderAllPhotosGrid(); };
    bar.appendChild(btnAll);

    tagSet.forEach(tag => {
        let btn = document.createElement("button");
        btn.className = `filter-tag-btn ${activeTagFilter === tag ? 'active' : ''}`;
        btn.innerText = tag;
        btn.onclick = () => { activeTagFilter = tag; renderAllPhotosTagBar(); renderAllPhotosGrid(); };
        bar.appendChild(btn);
    });
}

function renderAllPhotosGrid() {
    let grid = document.getElementById("all-photos-popup-grid"); grid.innerHTML = "";
    let allPhotos = [];
    characters.forEach(c => allPhotos = allPhotos.concat(c.photos));
    groups.forEach(g => allPhotos = allPhotos.concat(g.photos));

    if (allPhotos.length === 0) {
        grid.innerHTML = `<p class="empty-text" style="grid-column: span 3; padding: 50px 0;">저장된 전체 그림이 없습니다.</p>`; return;
    }
    allPhotos.sort((a, b) => b.time - a.time);
    if (activeTagFilter !== "전체") { allPhotos = allPhotos.filter(p => p.tags && p.tags.includes(activeTagFilter)); }

    if (allPhotos.length === 0) {
        grid.innerHTML = `<p class="empty-text" style="grid-column: span 3; padding: 50px 0;">매칭되는 그림이 없습니다.</p>`; return;
    }

    allPhotos.forEach(p => {
        let displayTags = (p.tags && p.tags.length > 0) ? p.tags.join(" ") : "";
        let cardHTML = `
            <div class="popup-photo-card">
                <img src="${p.url}">
                <p>${p.title}<span style="font-size: 11px; color: #a855f7; display: block; font-weight: normal; margin-top:3px;">출처: ${p.ownerName}</span></p>
                <div class="photo-tags-display">${displayTags}</div>
                <div class="photo-action-bar">
                    <button class="btn-save" onclick="downloadPhoto('${p.url}', '${p.title}')">💾 저장</button>
                    <button class="btn-zoom" onclick="zoomPhoto('${p.url}', '${p.title}')">🔍 크게보기</button>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

function addPhotoToGallery() {
    let title = document.getElementById("photo-title").value.trim();
    let tagInput = document.getElementById("photo-tags").value.trim();
    let fileInput = document.getElementById("photo-file");
    let file = fileInput.value ? fileInput.files[0] : null;

    if (title === "") { alert("그림의 이름을 입력해주세요!"); return; }
    if (!file) { alert("그림 파일을 선택해주세요!"); return; }

    let parsedTags = tagInput ? tagInput.split(/\s+/).map(t => t.startsWith('#') ? t : '#' + t) : [];
    let photoUrl = URL.createObjectURL(file);
    let newPhoto = {
        id: "photo_" + Date.now() + "_" + Math.random(),
        title: title, tags: parsedTags, url: photoUrl, time: Date.now(), ownerName: ""
    };

    if (currentOpenType === 'char') {
        let targetChar = characters.find(c => c.id === currentOpenId);
        if (targetChar) { newPhoto.ownerName = targetChar.name; targetChar.photos.push(newPhoto); }
    } else {
        let targetGroup = groups.find(g => g.id === currentOpenId);
        if (targetGroup) { newPhoto.ownerName = `그룹 [${targetGroup.name}]`; targetGroup.photos.push(newPhoto); }
    }

    renderPopupPhotos(); renderRecentPhotos();
    document.getElementById("photo-title").value = "";
    document.getElementById("photo-tags").value = "";
    fileInput.value = ""; resetPreviewZone();
}

function deletePhotoFromGallery(photoId) {
    if (currentOpenType === 'char') {
        let targetChar = characters.find(c => c.id === currentOpenId);
        if (targetChar) targetChar.photos = targetChar.photos.filter(p => p.id !== photoId);
    } else {
        let targetGroup = groups.find(g => g.id === currentOpenId);
        if (targetGroup) targetGroup.photos = targetGroup.photos.filter(p => p.id !== photoId);
    }
    renderPopupPhotos(); renderRecentPhotos();
}

function renderRecentPhotos() {
    let container = document.getElementById("recent-photos-container"); container.innerHTML = "";
    let allPhotos = [];
    characters.forEach(c => allPhotos = allPhotos.concat(c.photos));
    groups.forEach(g => allPhotos = allPhotos.concat(g.photos));

    if (allPhotos.length === 0) {
        container.innerHTML = `<p class="empty-text">아직 추가된 그림이 없습니다.</p>`; return;
    }
    allPhotos.sort((a, b) => b.time - a.time);
    let displayCount = Math.min(allPhotos.length, 3);

    for (let i = 0; i < displayCount; i++) {
        let p = allPhotos[i];
        let recentHTML = `
            <div class="recent-card">
                <img src="${p.url}">
                <div class="recent-title-container">
                    <span>${p.title}</span>
                    <button class="recent-zoom-icon-btn" onclick="zoomPhoto('${p.url}', '${p.title}')">🔍</button>
                </div>
            </div>
        `;
        container.innerHTML += recentHTML;
    }
}

function previewGalleryImage(input) {
    let previewZone = document.getElementById("file-preview-zone");
    let previewImg = document.getElementById("file-preview-img");
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function (e) { previewImg.src = e.target.result; previewZone.style.display = "flex"; }
        reader.readAsDataURL(input.files[0]);
    } else { resetPreviewZone(); }
}

function resetPreviewZone() {
    document.getElementById("file-preview-zone").style.display = "none";
    document.getElementById("file-preview-img").src = "";
}

function downloadPhoto(url, title) {
    let link = document.createElement("a"); link.href = url; link.download = title || "won-nol-image";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function zoomPhoto(url, title) {
    let zoomModal = document.getElementById("zoom-modal");
    document.getElementById("zoom-target-img").src = url;
    document.getElementById("zoom-target-title").innerText = title || "";
    zoomModal.style.display = "flex";
}
function closeZoomPhoto() { document.getElementById("zoom-modal").style.display = "none"; }