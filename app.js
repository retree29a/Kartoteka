// Firebase URL
const FIREBASE_DB_URL = "https://f1lc-afbbc-default-rtdb.asia-southeast1.firebasedatabase.app/kartoteka.json";
const FIREBASE_TAGS_URL = "https://f1lc-afbbc-default-rtdb.asia-southeast1.firebasedatabase.app/kartoteka_tags.json";

// Инициализация базы данных
let npcs = [];
let tags = [];

// DOM Элементы
const npcGrid = document.getElementById('npc-grid');
const searchInput = document.getElementById('search-input');

// Модальные окна
const modalCreate = document.getElementById('modal-create');
const modalEdit = document.getElementById('modal-edit');
const modalGenerate = document.getElementById('modal-generate');
const modalTags = document.getElementById('modal-tags');
const btnOpenCreate = document.getElementById('btn-open-create');
const btnOpenGenerate = document.getElementById('btn-open-generate');
const btnOpenTags = document.getElementById('btn-open-tags');
const closeBtns = document.querySelectorAll('.close-btn');

// Формы
const formCreate = document.getElementById('form-create');
const formEdit = document.getElementById('form-edit');
const formGenerate = document.getElementById('form-generate');
const formAddTag = document.getElementById('form-add-tag');

// Элементы превью фото (Создание)
const photoUrlInput = document.getElementById('create-photo-url');
const photoFileInput = document.getElementById('create-photo-file');
const photoPreview = document.getElementById('create-photo-preview');
let currentPhotoData = '';

// Элементы превью фото (Редактирование)
const editPhotoUrlInput = document.getElementById('edit-photo-url');
const editPhotoFileInput = document.getElementById('edit-photo-file');
const editPhotoPreview = document.getElementById('edit-photo-preview');
let currentEditPhotoData = '';

// Коэффициент генерации
const generateCoefficient = document.getElementById('generate-coefficient');
const coeffValueText = document.getElementById('coeff-value');

// Утилита для генерации уникального ID
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Обработка превью фото
function handlePhotoPreview(src) {
  if (src) {
    photoPreview.src = src;
    photoPreview.classList.remove('hidden');
    currentPhotoData = src;
  } else {
    photoPreview.src = '';
    photoPreview.classList.add('hidden');
    currentPhotoData = '';
  }
}

function handleEditPhotoPreview(src) {
  if (src) {
    editPhotoPreview.src = src;
    editPhotoPreview.classList.remove('hidden');
    currentEditPhotoData = src;
  } else {
    editPhotoPreview.src = '';
    editPhotoPreview.classList.add('hidden');
    currentEditPhotoData = '';
  }
}

photoUrlInput.addEventListener('input', (e) => {
  if (e.target.value) {
    photoFileInput.value = ''; // Сбрасываем файл
    handlePhotoPreview(e.target.value);
  } else {
    handlePhotoPreview('');
  }
});

photoFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    photoUrlInput.value = ''; // Сбрасываем URL
    const reader = new FileReader();
    reader.onload = function(event) {
      handlePhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    handlePhotoPreview('');
  }
});

editPhotoUrlInput.addEventListener('input', (e) => {
  if (e.target.value) {
    editPhotoFileInput.value = '';
    handleEditPhotoPreview(e.target.value);
  } else {
    handleEditPhotoPreview('');
  }
});

editPhotoFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    editPhotoUrlInput.value = '';
    const reader = new FileReader();
    reader.onload = function(event) {
      handleEditPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    handleEditPhotoPreview('');
  }
});

// Открытие / Закрытие модалок
btnOpenCreate.addEventListener('click', () => {
  formCreate.reset();
  handlePhotoPreview('');
  renderTagsCheckboxes();
  modalCreate.classList.add('active');
});

btnOpenGenerate.addEventListener('click', () => modalGenerate.classList.add('active'));

btnOpenTags.addEventListener('click', () => {
  renderTagsManage();
  modalTags.classList.add('active');
});

closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-modal');
    document.getElementById(modalId).classList.remove('active');
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Сохранение и Загрузка Тегов
async function saveTags() {
  try {
    await fetch(FIREBASE_TAGS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tags)
    });
  } catch (e) {
    console.error("Ошибка сохранения тегов в Firebase:", e);
  }
}

async function loadTags() {
  try {
    const response = await fetch(FIREBASE_TAGS_URL);
    const data = await response.json();
    if (data) {
      tags = data;
    } else {
      tags = [];
    }
  } catch (e) {
    console.error("Ошибка загрузки тегов:", e);
    tags = [];
  }
  renderTagsManage();
  renderTagsCheckboxes();
}

// Обработка тегов (создание и рендер)
formAddTag.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('new-tag-name');
  const colorInput = document.getElementById('new-tag-color');
  
  const newTag = {
    id: generateId(),
    name: nameInput.value.trim(),
    color: colorInput.value
  };
  
  tags.push(newTag);
  saveTags();
  renderTagsManage();
  renderTagsCheckboxes();
  formAddTag.reset();
  colorInput.value = "#bb86fc";
});

// Удаление тега глобально
window.deleteTag = function(id) {
  if(confirm("Удалить этот тег?")) {
    tags = tags.filter(t => t.id !== id);
    saveTags();
    renderTagsManage();
    renderTagsCheckboxes();
    renderNpcs(); // Перерисовать НПС, чтобы тег пропал
  }
};

function renderTagsManage() {
  const container = document.getElementById('tags-list');
  if(tags.length === 0) {
    container.innerHTML = '<span class="text-secondary" style="font-size:13px;">Тегов пока нет.</span>';
    return;
  }
  
  container.innerHTML = tags.map(t => `
    <span class="tag-badge" style="background-color: ${t.color}">
      ${t.name}
      <span class="remove-tag-btn" onclick="deleteTag('${t.id}')">&times;</span>
    </span>
  `).join('');
}

function renderTagsCheckboxes() {
  const container = document.getElementById('create-tags-container');
  if(tags.length === 0) {
    container.innerHTML = '<span class="text-secondary" style="font-size:13px;">Нет доступных тегов.</span>';
    return;
  }
  
  container.innerHTML = tags.map(t => `
    <label class="tag-checkbox-label">
      <input type="checkbox" name="npc_tags" value="${t.id}">
      <span style="color: ${t.color}; font-weight: bold;">${t.name}</span>
    </label>
  `).join('');
}

// Сохранение в Firebase
async function saveNpcs() {
  try {
    await fetch(FIREBASE_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(npcs)
    });
  } catch (e) {
    console.error("Ошибка сохранения в Firebase:", e);
  }
  renderNpcs();
}

// Загрузка из Firebase
async function loadNpcs() {
  npcGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1; padding: 40px;">Загрузка досье из базы данных...</p>';
  try {
    const response = await fetch(FIREBASE_DB_URL);
    const data = await response.json();
    if (data) {
      npcs = data;
    } else {
      npcs = [];
    }
  } catch (e) {
    console.error("Ошибка загрузки из Firebase:", e);
    npcs = [];
  }
  renderNpcs();
}

// Удаление НПС
function deleteNpc(id) {
  if(confirm("Вы уверены, что хотите удалить это досье?")) {
    npcs = npcs.filter(npc => npc.id !== id);
    saveNpcs();
  }
}

// Рендеринг карточек
function renderNpcs(searchTerm = '') {
  npcGrid.innerHTML = '';
  
  const filteredNpcs = npcs.filter(npc => {
    const fullName = `${npc.firstName} ${npc.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (filteredNpcs.length === 0) {
    npcGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px;">Картотека пуста. Создайте или сгенерируйте НПС.</p>';
    return;
  }

  filteredNpcs.forEach(npc => {
    const card = document.createElement('div');
    card.className = 'npc-card';
    
    // Фото
    let photoHtml = '';
    if (npc.photo) {
      photoHtml = `<img src="${npc.photo}" alt="${npc.firstName}" class="npc-photo">`;
    } else {
      photoHtml = `<div class="npc-photo-placeholder">👤</div>`;
    }

    // Теги НПС
    let tagsHtml = '';
    if (npc.tags && npc.tags.length > 0) {
      const npcTagsData = npc.tags.map(tagId => tags.find(t => t.id === tagId)).filter(t => t);
      if (npcTagsData.length > 0) {
        tagsHtml = `
          <div class="npc-tags-display">
            ${npcTagsData.map(t => `<span class="tag-badge" style="background-color: ${t.color}">${t.name}</span>`).join('')}
          </div>
        `;
      }
    }

    // Параметры (Traits)
    let traitsHtml = '';
    if (npc.traits && npc.traits.length > 0) {
      const traitTags = npc.traits.map(t => {
        // Пытаемся определить класс (позитивный или негативный) для цвета
        // Если это ручной ввод, просто нейтральный
        let tClass = '';
        if (GenerationData.positiveTraits.includes(t)) tClass = 'positive';
        if (GenerationData.negativeTraits.includes(t)) tClass = 'negative';
        return `<span class="trait-tag ${tClass}">${t}</span>`;
      }).join('');
      
      traitsHtml = `
        <div class="traits-container">
          <div class="traits-title">Параметры характера</div>
          <div class="traits-list">${traitTags}</div>
        </div>
      `;
    }

    // Записи / Ситуации
    let recordsHtml = '';
    if (npc.records && npc.records.length > 0) {
      const recordItems = npc.records.map(r => {
        let rClass = 'record-neutral';
        if (GenerationData.positiveRecords.includes(r)) rClass = 'record-positive';
        if (GenerationData.negativeRecords.includes(r)) rClass = 'record-negative';
        return `<li class="${rClass}">${r}</li>`;
      }).join('');
      
      recordsHtml = `
        <div class="records-container">
          <div class="traits-title">События из жизни</div>
          <ul class="records-list">${recordItems}</ul>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        ${photoHtml}
        <div class="npc-title">
          ${tagsHtml}
          <h3>${npc.firstName} ${npc.lastName}</h3>
          <p>${npc.age} лет</p>
        </div>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">Место рождения:</span>
          <span class="info-value">${npc.birthplace || 'Неизвестно'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Религия:</span>
          <span class="info-value">${npc.religion || 'Нет'}</span>
        </div>
        ${traitsHtml}
        ${recordsHtml}
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" onclick="openEditNpc('${npc.id}')" style="margin-right: 10px;">Редактировать</button>
        <button class="btn btn-danger" onclick="deleteNpc('${npc.id}')">Удалить досье</button>
      </div>
    `;
    npcGrid.appendChild(card);
  });
}

// Поиск
searchInput.addEventListener('input', (e) => {
  renderNpcs(e.target.value);
});

// Ручное создание
formCreate.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const traitsRaw = document.getElementById('create-traits').value;
  const traitsArray = traitsRaw ? traitsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

  const recordsRaw = document.getElementById('create-records').value;
  const recordsArray = recordsRaw ? recordsRaw.split('\n').map(r => r.trim()).filter(r => r) : [];

  // Получаем выбранные теги
  const checkedTags = Array.from(document.querySelectorAll('input[name="npc_tags"]:checked')).map(cb => cb.value);

  const newNpc = {
    id: generateId(),
    firstName: document.getElementById('create-firstname').value.trim(),
    lastName: document.getElementById('create-lastname').value.trim(),
    age: document.getElementById('create-age').value,
    birthplace: document.getElementById('create-birthplace').value.trim(),
    religion: document.getElementById('create-religion').value.trim(),
    photo: currentPhotoData,
    traits: traitsArray,
    records: recordsArray,
    tags: checkedTags,
    createdAt: new Date().toISOString()
  };

  npcs.unshift(newNpc); // Добавляем в начало списка
  saveNpcs();
  modalCreate.classList.remove('active');
  formCreate.reset();
  handlePhotoPreview('');
});

// Редактирование НПС
window.openEditNpc = function(id) {
  const npc = npcs.find(n => n.id === id);
  if(!npc) return;

  document.getElementById('edit-id').value = npc.id;
  document.getElementById('edit-firstname').value = npc.firstName;
  document.getElementById('edit-lastname').value = npc.lastName;
  document.getElementById('edit-age').value = npc.age;
  document.getElementById('edit-birthplace').value = npc.birthplace;
  document.getElementById('edit-religion').value = npc.religion || '';
  
  document.getElementById('edit-traits').value = (npc.traits || []).join(', ');
  document.getElementById('edit-records').value = (npc.records || []).join('\n');
  
  // Фото
  editPhotoUrlInput.value = '';
  editPhotoFileInput.value = '';
  handleEditPhotoPreview(npc.photo || '');

  // Теги
  const container = document.getElementById('edit-tags-container');
  if(tags.length === 0) {
    container.innerHTML = '<span class="text-secondary" style="font-size:13px;">Нет доступных тегов.</span>';
  } else {
    container.innerHTML = tags.map(t => {
      const isChecked = (npc.tags || []).includes(t.id) ? 'checked' : '';
      return `
        <label class="tag-checkbox-label">
          <input type="checkbox" name="edit_npc_tags" value="${t.id}" ${isChecked}>
          <span style="color: ${t.color}; font-weight: bold;">${t.name}</span>
        </label>
      `;
    }).join('');
  }

  modalEdit.classList.add('active');
};

formEdit.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  const npcIndex = npcs.findIndex(n => n.id === id);
  if(npcIndex === -1) return;

  const traitsRaw = document.getElementById('edit-traits').value;
  const traitsArray = traitsRaw ? traitsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

  const recordsRaw = document.getElementById('edit-records').value;
  const recordsArray = recordsRaw ? recordsRaw.split('\n').map(r => r.trim()).filter(r => r) : [];

  const checkedTags = Array.from(document.querySelectorAll('input[name="edit_npc_tags"]:checked')).map(cb => cb.value);

  npcs[npcIndex] = {
    ...npcs[npcIndex],
    firstName: document.getElementById('edit-firstname').value.trim(),
    lastName: document.getElementById('edit-lastname').value.trim(),
    age: document.getElementById('edit-age').value,
    birthplace: document.getElementById('edit-birthplace').value.trim(),
    religion: document.getElementById('edit-religion').value.trim(),
    photo: currentEditPhotoData,
    traits: traitsArray,
    records: recordsArray,
    tags: checkedTags
  };

  saveNpcs();
  modalEdit.classList.remove('active');
});

// Обновление текста ползунка генерации
generateCoefficient.addEventListener('input', (e) => {
  coeffValueText.textContent = e.target.value;
});

// Утилита для случайного выбора из массива
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Логика автоматической генерации
formGenerate.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const coeff = parseInt(generateCoefficient.value); // от 0 до 100
  // Вероятность выбора позитивной черты = coeff / 100
  const probPositive = coeff / 100;
  
  const generatedTraits = [];
  const totalTraits = 10;
  
  // Копируем массивы, чтобы не выбирать одинаковые черты
  let availablePositive = [...GenerationData.positiveTraits];
  let availableNegative = [...GenerationData.negativeTraits];

  for (let i = 0; i < totalTraits; i++) {
    const isPositive = Math.random() < probPositive;
    
    if (isPositive && availablePositive.length > 0) {
      const idx = Math.floor(Math.random() * availablePositive.length);
      generatedTraits.push(availablePositive.splice(idx, 1)[0]);
    } else if (!isPositive && availableNegative.length > 0) {
      const idx = Math.floor(Math.random() * availableNegative.length);
      generatedTraits.push(availableNegative.splice(idx, 1)[0]);
    } else {
      // Если один из массивов закончился (хотя их по 50, так что для 10 не закончится), берем из другого
      if(availablePositive.length > 0) {
         const idx = Math.floor(Math.random() * availablePositive.length);
         generatedTraits.push(availablePositive.splice(idx, 1)[0]);
      }
    }
  }

  // Генерация ситуаций/историй
  const numRecords = randomInt(1, 3);
  const generatedRecords = [];
  let availablePosRecords = [...GenerationData.positiveRecords];
  let availableNegRecords = [...GenerationData.negativeRecords];
  
  for (let i = 0; i < numRecords; i++) {
    const isPositive = Math.random() < probPositive;
    if (isPositive && availablePosRecords.length > 0) {
      const idx = Math.floor(Math.random() * availablePosRecords.length);
      generatedRecords.push(availablePosRecords.splice(idx, 1)[0]);
    } else if (!isPositive && availableNegRecords.length > 0) {
      const idx = Math.floor(Math.random() * availableNegRecords.length);
      generatedRecords.push(availableNegRecords.splice(idx, 1)[0]);
    } else {
      if(availablePosRecords.length > 0) {
         const idx = Math.floor(Math.random() * availablePosRecords.length);
         generatedRecords.push(availablePosRecords.splice(idx, 1)[0]);
      }
    }
  }

  // Генерация остальных параметров
  const firstName = randomPick(GenerationData.maleNames);
  const lastName = randomPick(GenerationData.surnames);
  
  const generatedNpc = {
    id: generateId(),
    firstName: firstName,
    lastName: lastName,
    age: randomInt(18, 60),
    birthplace: randomPick(GenerationData.placesOfBirth),
    religion: Math.random() > 0.3 ? randomPick(GenerationData.religions) : "Атеизм",
    photo: '', // Можно подключить случайные аватары (например API thispersondoesnotexist или RoboHash), пока оставим пустым
    traits: generatedTraits,
    records: generatedRecords,
    createdAt: new Date().toISOString()
  };

  npcs.unshift(generatedNpc);
  saveNpcs();
  modalGenerate.classList.remove('active');
});

// Инициализация при загрузке
async function initApp() {
  await loadTags();
  await loadNpcs();
}

initApp();
