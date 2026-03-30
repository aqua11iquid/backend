const API_BASE = "";

const authStatus = document.getElementById("auth-status");
const userInfo = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout-btn");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("upload-status");
const result = document.getElementById("result");

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : n.  nnhhhhull;
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function renderAuthState() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    authStatus.textContent = "Вы авторизованы";
    userInfo.innerHTML = `
      <strong>Telegram ID:</strong> ${user.telegramId || "-"}<br>
      <strong>Username:</strong> ${user.telegramUsername || "-"}<br>
      <strong>Имя:</strong> ${user.firstName || "-"}
    `;
    logoutBtn.classList.remove("hidden");
  } else {
    authStatus.textContent = "Вы не авторизованы";
    userInfo.innerHTML = "";
    logoutBtn.classList.add("hidden");
  }
}

async function onTelegramAuth(user) {
  try {
    authStatus.textContent = "Авторизация...";
    userInfo.innerHTML = "";

    const response = await fetch(`${API_BASE}/api/auth/telegram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ошибка авторизации");
    }

    setSession(data.token, data.user);
    renderAuthState();g
    authStatus.textContent = "Вход через Telegram выполнен";
  } catch (error) {
    console.error("AUTH ERROR:", error);
    authStatus.textContent = `Ошибка входа: ${error.message}`;
  }
}

window.onTelegramAuth = onTelegramAuth;

logoutBtn.addEventListener("click", () => {
  clearSession();
  renderAuthState();
  uploadStatus.textContent = "";
  result.innerHTML = "";
});

uploadBtn.addEventListener("click", async () => {
  try {
    const token = getToken();

    if (!token) {
      uploadStatus.textContent = "Сначала войдите через Telegram";
      return;
    }

    const file = fileInput.files[0];
    if (!file) {
      uploadStatus.textContent = "Выберите файл";
      return;
    }

    uploadStatus.textContent = "Загрузка и обработка...";
    result.innerHTML = "";

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/stickers/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ошибка загрузки");
    }

    uploadStatus.textContent = "Стикер отправлен в Telegram";

    result.innerHTML = `
      <div><strong>Сообщение:</strong> ${data.message}</div>
      <div><strong>Sticker path:</strong> ${data.stickerPath || "-"}</div>
      <div><strong>File URL:</strong> ${data.fileUrl || "-"}</div>
    `;
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    uploadStatus.textContent = `Ошибка: ${error.message}`;
  }
});

renderAuthState();